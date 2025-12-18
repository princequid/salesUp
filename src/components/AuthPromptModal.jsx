import React, { useEffect, useState } from 'react';
import { AppButton, AppInput, AppModal } from './index';

const AuthPromptModal = ({
  isOpen,
  onClose,
  reason,
  hasBusinessRegistered,
  pendingPostRegisterLogin,
  onRegister,
  onLoginCashier,
  onLoginAdmin
}) => {
  const [businessName, setBusinessName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [cashierUsername, setCashierUsername] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setIsWorking(false);
    setBusinessName('');
    setAdminPassword('');
    setAdminPasswordConfirm('');
    setCashierUsername('');
    setCashierPassword('');
    setLoginPassword('');
  }, [isOpen]);

  const safeReason = String(reason || '').trim();
  const showRegister = !hasBusinessRegistered && !pendingPostRegisterLogin;
  const showAdminLogin = hasBusinessRegistered || pendingPostRegisterLogin;
  const showCashierLogin = !pendingPostRegisterLogin;

  const handleRegister = async () => {
    if (isWorking) return;
    setError('');
    setIsWorking(true);
    try {
      await onRegister({ businessName, adminPassword, adminPasswordConfirm });
    } catch (e) {
      setError(e?.message || 'Registration failed');
      setIsWorking(false);
    }
  };

  const handleAdminLogin = async () => {
    if (isWorking) return;
    setError('');
    setIsWorking(true);
    try {
      await onLoginAdmin({ password: loginPassword });
    } catch (e) {
      setError(e?.message || 'Login failed');
      setIsWorking(false);
    }
  };

  const handleCashierLogin = async () => {
    if (isWorking) return;
    setError('');
    setIsWorking(true);
    try {
      await onLoginCashier({ username: cashierUsername, password: cashierPassword });
    } catch (e) {
      setError(e?.message || 'Login failed');
      setIsWorking(false);
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Continue to use SalesUP" maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
          {safeReason || 'You must register your business or log in to continue.'}
        </div>

        {!!error && (
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-danger-soft)',
            color: 'var(--accent-danger)',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          {showRegister && (
            <div style={{
              padding: 'var(--spacing-md)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Register Business (Admin)</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Create a business profile and set an Admin password.
              </div>

              <AppInput
                label="Business Name"
                name="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. My Awesome Store"
              />

              <AppInput
                label="Admin Password"
                type="password"
                name="adminPassword"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Minimum 4 characters"
              />

              <AppInput
                label="Confirm Password"
                type="password"
                name="adminPasswordConfirm"
                value={adminPasswordConfirm}
                onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                placeholder="Re-enter password"
              />

              <AppButton fullWidth onClick={handleRegister} disabled={isWorking}>
                {isWorking ? 'Working...' : 'Register Business'}
              </AppButton>
            </div>
          )}

          {showCashierLogin && (
            <div style={{
              padding: 'var(--spacing-md)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Login as Cashier</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Continue in cashier mode.
              </div>

              <AppInput
                label="Cashier Username"
                name="cashierUsername"
                value={cashierUsername}
                onChange={(e) => setCashierUsername(e.target.value)}
                placeholder="e.g. cashier01"
              />

              <AppInput
                label="Cashier Password"
                type="password"
                name="cashierPassword"
                value={cashierPassword}
                onChange={(e) => setCashierPassword(e.target.value)}
                placeholder="Enter password"
              />

              <AppButton fullWidth variant="secondary" onClick={handleCashierLogin} disabled={isWorking}>
                {isWorking ? 'Working...' : 'Login as Cashier'}
              </AppButton>
            </div>
          )}

          {showAdminLogin && (
            <div style={{
              padding: 'var(--spacing-md)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Login as Admin</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Enter the Admin password to continue.
              </div>

              <AppInput
                label="Admin Password"
                type="password"
                name="adminLoginPassword"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
              />

              <AppButton fullWidth onClick={handleAdminLogin} disabled={isWorking}>
                {isWorking ? 'Working...' : 'Login as Admin'}
              </AppButton>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <AppButton variant="ghost" onClick={onClose} disabled={isWorking}>
            Close
          </AppButton>
        </div>
      </div>
    </AppModal>
  );
};

export default AuthPromptModal;
