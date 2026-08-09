import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Shield, Server, CheckCircle2, User, Key, Database } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-agri-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.welcome}</h1>
          <p className="text-xs text-agri-200 mt-1">
            SRI BASAVESHWARA & CO. • Operating Platform Sprint 1 Baseline
          </p>
        </div>
        <Badge variant="success" className="w-fit text-sm px-3 py-1 bg-agri-500/20 text-agri-300 border-agri-500">
          Sprint 1 Platform Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t.activeSession}</CardTitle>
            <User className="w-4 h-4 text-agri-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.fullName}</div>
            <p className="text-xs text-slate-500 font-mono mt-1">{user?.userCode} ({user?.username})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t.role}</CardTitle>
            <Shield className="w-4 h-4 text-harvest-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-harvest-600">{user?.roles?.[0] || 'ROLE_PROPRIETOR'}</div>
            <p className="text-xs text-slate-500 mt-1">Unrestricted Super-Admin Access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t.systemStatus}</CardTitle>
            <Server className="w-4 h-4 text-agri-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Clean Architecture Ready</div>
            <p className="text-xs text-agri-600 font-medium mt-1">JWT Security Filter Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Architecture Verification Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-agri-600" />
            <span>Sprint 1 Platform Readiness Verification Checklist</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-agri-700 dark:text-agri-400 font-semibold text-sm">
                <Database className="w-4 h-4" />
                <span>Database Migration (Flyway V1)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                11 Platform tables initialized: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">users</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">roles</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">refresh_tokens</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">audit_logs</code>. Zero business domain tables loaded.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-agri-700 dark:text-agri-400 font-semibold text-sm">
                <Key className="w-4 h-4" />
                <span>Security & JWT Authentication</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Spring Security 6 stateless filter chain, HMAC-SHA512 token signing, BCrypt hashing, and automated refresh token rotation active.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
