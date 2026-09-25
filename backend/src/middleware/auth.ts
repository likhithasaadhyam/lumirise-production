import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

interface JwtPayload { userId: string }

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  roleId: string;
  firstName: string;
  lastName: string;
  employeeId?: string | null;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verify user & tenant still exist and are active with role permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: { permissions: true },
        },
        organization: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'User account is inactive or revoked.' });
    }

    const permissions = user.role.permissions.map((p: { code: string }): string => p.code);

    req.user = {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: user.employeeId,
      permissions,
    };
    req.organizationId = user.organizationId;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      code: 'FORBIDDEN_ROLE',
    });
  };
};

export const requirePermission = (permissionOrPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Super Admin / Org Owner has full access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const required = Array.isArray(permissionOrPermissions)
      ? permissionOrPermissions
      : [permissionOrPermissions];

    // Check if user has at least one of the required permissions
    const hasPermission = required.some((perm) => req.user!.permissions.includes(perm));

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({
      message: `Forbidden: You do not have permission to perform this action. Required: [${required.join(', ')}]`,
      code: 'FORBIDDEN_PERMISSION',
      requiredPermissions: required,
      userPermissions: req.user.permissions,
      userRole: req.user.role,
    });
  };
};
