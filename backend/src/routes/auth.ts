import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { recordAuditLog } from '../utils/audit.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

const createResetToken = (email: string) => {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  passwordResetTokens.set(token, { email, expiresAt: Date.now() + 15 * 60 * 1000 });
  return token;
};

// Sign In
router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        role: {
          include: { permissions: true },
        },
        organization: true,
        employee: {
          include: { department: true, shift: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact your company administrator.' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role.name,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `User ${user.email} signed in successfully.`,
    });

    const permissions = user.role.permissions.map((p: { code: string }) => p.code);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.role.name,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee,
        avatar: user.avatar,
        status: user.status,
        permissions,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
        currency: user.organization.currency,
      },
    });
  } catch (error: any) {
    console.error('Sign-in error:', error);
    return res.status(500).json({ message: 'Server error during sign-in.' });
  }
});

// Sign Up: Creates Organization + Admin Account + Default Setup
router.post('/sign-up', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      industry,
      companySize,
      country,
      businessEmail,
      fullName,
      password,
    } = req.body;

    if (!companyName || !businessEmail || !fullName || !password) {
      return res.status(400).json({ message: 'Company Name, Business Email, Full Name, and Password are required.' });
    }

    const baseCode = companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    const code = `${baseCode || 'LUMI'}-${Math.floor(100 + Math.random() * 900)}`;

    const org = await prisma.organization.create({
      data: {
        name: companyName,
        code,
        industry: industry || 'Manufacturing',
        size: companySize || '50-100',
        country: country || 'United States',
        email: businessEmail,
        currency: 'USD',
      },
    });

    const roleAdmin = await prisma.role.create({
      data: {
        organizationId: org.id,
        name: 'ADMIN',
        description: 'Organization Administrator with full access',
        isSystem: true,
      },
    });

    // Seed master permissions for admin
    const allPermissions = [
      'dashboard.view',
      'production.view', 'production.create', 'production.manage',
      'quality.view', 'quality.manage',
      'finished_goods.view', 'dispatch.view', 'dispatch.manage',
      'inventory.view', 'inventory.manage',
      'warehouse.view', 'warehouse.manage',
      'stock.view', 'stock.manage',
      'supplier.view', 'supplier.manage',
      'employees.view', 'employees.manage',
      'attendance.view', 'attendance.manage',
      'leave.view', 'leave.manage',
      'recruitment.view', 'recruitment.manage',
      'payroll.view', 'payroll.manage',
      'customers.view', 'customers.manage',
      'leads.view', 'leads.manage',
      'sales_orders.view', 'sales_orders.manage',
      'invoices.view', 'invoices.manage',
      'payments.view', 'payments.manage',
      'reports.view', 'reports.production', 'reports.inventory', 'reports.hr', 'reports.financial',
      'settings.view', 'users.manage', 'roles.manage',
      'audit.view', 'employee_portal.view', 'my_profile.view', 'my_tasks.view', 'my_orders.view',
      'my_attendance.view', 'my_leave.view', 'my_payslips.view', 'my_performance.view', 'my_documents.view',
    ];

    for (const permCode of allPermissions) {
      await prisma.permission.create({
        data: {
          roleId: roleAdmin.id,
          code: permCode,
          module: permCode.split('.')[0].toUpperCase(),
          action: permCode.split('.')[1]?.toUpperCase() || 'VIEW',
        },
      });
    }

    const dept = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: 'Executive & Operations',
        code: 'EXEC',
      },
    });

    const shift = await prisma.shift.create({
      data: {
        organizationId: org.id,
        name: 'General Shift',
        code: 'SFT-GEN',
        startTime: '09:00',
        endTime: '18:00',
      },
    });

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Admin';

    const emp = await prisma.employee.create({
      data: {
        organizationId: org.id,
        employeeCode: 'EMP-1001',
        firstName,
        lastName,
        email: businessEmail.toLowerCase(),
        departmentId: dept.id,
        designation: 'Managing Director / Executive Admin',
        roleId: roleAdmin.id,
        shiftId: shift.id,
        joiningDate: new Date(),
        basicSalary: 10000,
        status: 'ACTIVE',
      },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: businessEmail.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roleId: roleAdmin.id,
        employeeId: emp.id,
        status: 'ACTIVE',
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: org.id,
        email: user.email,
        role: roleAdmin.name,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: roleAdmin.name,
        employeeId: user.employeeId,
        status: user.status,
        permissions: allPermissions,
      },
      organization: {
        id: org.id,
        name: org.name,
        code: org.code,
        currency: org.currency,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create workspace: ' + error.message });
  }
});

// Request password reset code
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body ?? {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.json({
        message: 'If that account exists, a password reset code has been generated for the next step.',
      });
    }

    const token = createResetToken(user.email);

    return res.json({
      message: 'If that account exists, a password reset code has been generated for the next step.',
      resetToken: process.env.NODE_ENV !== 'production' ? token : undefined,
      expiresInMinutes: 15,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to process password reset request: ' + error.message });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body ?? {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedToken = String(token || '').trim();
    const nextPassword = String(newPassword || '').trim();

    if (!normalizedEmail || !normalizedToken || !nextPassword) {
      return res.status(400).json({ message: 'Email, reset code, and a new password are required.' });
    }

    if (nextPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const tokenEntry = passwordResetTokens.get(normalizedToken);
    if (!tokenEntry || tokenEntry.email !== normalizedEmail || tokenEntry.expiresAt < Date.now()) {
      passwordResetTokens.delete(normalizedToken);
      return res.status(400).json({ message: 'Invalid or expired reset code.' });
    }

    const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ message: 'No account matched that reset request.' });
    }

    const passwordHash = await bcrypt.hash(nextPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    passwordResetTokens.delete(normalizedToken);

    return res.json({
      message: 'Password updated successfully. You can sign in with your new password.',
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to update password: ' + error.message });
  }
});

// Current Authenticated User
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        role: {
          include: { permissions: true },
        },
        organization: true,
        employee: {
          include: { department: true, shift: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = user.role.permissions.map((p: { code: string }) => p.code);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.role.name,
        employeeId: user.employeeId,
        avatar: user.avatar,
        status: user.status,
        permissions,
        employee: user.employee,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
        currency: user.organization.currency,
        industry: user.organization.industry,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Demo/Testing Helper: Quick Role Switcher
router.post('/switch-role', authenticate, async (req: Request, res: Response) => {
  try {
    // Development-Only Guard: Role switching is disabled in production
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_ROLE_SWITCH !== 'true') {
      return res.status(403).json({
        message: 'Role switching is strictly disabled in production environments.',
        code: 'DEV_FEATURE_DISABLED',
      });
    }

    const { targetRole } = req.body;
    const orgId = req.organizationId!;

    const targetUser = await prisma.user.findFirst({
      where: {
        organizationId: orgId,
        role: { name: targetRole },
      },
      include: {
        role: {
          include: { permissions: true },
        },
        organization: true,
        employee: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: `No user found in organization with role ${targetRole}` });
    }

    const token = jwt.sign(
      {
        userId: targetUser.id,
        organizationId: targetUser.organizationId,
        email: targetUser.email,
        role: targetUser.role.name,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        employeeId: targetUser.employeeId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const permissions = targetUser.role.permissions.map((p: { code: string }): string => p.code);

    return res.json({
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        roleId: targetUser.roleId,
        roleName: targetUser.role.name,
        employeeId: targetUser.employeeId,
        avatar: targetUser.avatar,
        status: targetUser.status,
        permissions,
      },
      organization: {
        id: targetUser.organization.id,
        name: targetUser.organization.name,
        code: targetUser.organization.code,
        currency: targetUser.organization.currency,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error switching role: ' + error.message });
  }
});

export default router;
