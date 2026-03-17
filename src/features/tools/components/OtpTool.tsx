import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Plus, Trash2, Copy, Check, QrCode } from 'lucide-react';
import { useClipboard, useLocalStorage } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

interface OtpAccount {
  id: string;
  name: string;
  issuer: string;
  secret: string;
  digits: number;
  period: number;
  algorithm: string;
}

interface GeneratedCode {
  accountId: string;
  code: string;
  remainingTime: number;
  progress: number;
}

export function OtpTool() {
  const [accounts, setAccounts] = useLocalStorage<OtpAccount[]>('otp-accounts', []);
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const { copied, copy } = useClipboard();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 新账户表单
  const [newAccount, setNewAccount] = useState({
    name: '',
    issuer: '',
    secret: '',
    digits: 6,
    period: 30,
    algorithm: 'SHA1',
  });

  // 生成当前验证码
  const generateCodes = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    
    const newCodes = accounts.map(account => {
      try {
        const totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(account.secret),
          digits: account.digits,
          period: account.period,
          algorithm: account.algorithm as 'SHA1' | 'SHA256' | 'SHA512',
          issuer: account.issuer,
          label: account.name,
        });

        const code = totp.generate();
        const remaining = account.period - (now % account.period);
        const progress = (remaining / account.period) * 100;

        return {
          accountId: account.id,
          code,
          remainingTime: remaining,
          progress,
        };
      } catch {
        return {
          accountId: account.id,
          code: 'ERROR',
          remainingTime: 0,
          progress: 0,
        };
      }
    });

    setCodes(newCodes);
  }, [accounts]);

  // 定时更新验证码
  useEffect(() => {
    generateCodes();
    intervalRef.current = setInterval(generateCodes, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [generateCodes]);

  // 生成二维码
  useEffect(() => {
    const generateQR = async () => {
      if (!selectedAccount) {
        setQrCodeDataUrl('');
        return;
      }

      const account = accounts.find(a => a.id === selectedAccount);
      if (!account) return;

      try {
        const totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(account.secret),
          digits: account.digits,
          period: account.period,
          algorithm: account.algorithm as 'SHA1' | 'SHA256' | 'SHA512',
          issuer: account.issuer,
          label: account.name,
        });

        const uri = totp.toString();
        const dataUrl = await QRCode.toDataURL(uri, {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch {
        setQrCodeDataUrl('');
      }
    };

    generateQR();
  }, [selectedAccount, accounts]);

  // 添加账户
  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.secret) return;

    // 清理密钥（移除空格）
    const cleanSecret = newAccount.secret.replace(/\s/g, '').toUpperCase();

    const account: OtpAccount = {
      id: Date.now().toString(),
      name: newAccount.name,
      issuer: newAccount.issuer || 'Unknown',
      secret: cleanSecret,
      digits: newAccount.digits,
      period: newAccount.period,
      algorithm: newAccount.algorithm,
    };

    setAccounts([...accounts, account]);
    setNewAccount({
      name: '',
      issuer: '',
      secret: '',
      digits: 6,
      period: 30,
      algorithm: 'SHA1',
    });
    setShowAddForm(false);
  };

  // 删除账户
  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    if (selectedAccount === id) {
      setSelectedAccount(null);
    }
  };

  // 复制验证码
  const handleCopyCode = (code: string) => {
    copy(code);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <ToolHeader
        title="OTP 验证码"
        description="生成基于时间的一次性密码（TOTP）"
      />

      {/* 添加账户按钮 */}
      <div className="flex justify-end mb-4 sm:mb-5">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary btn-action"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          添加账户
        </button>
      </div>

      {/* 添加账户表单 */}
      {showAddForm && (
        <div className="card p-4 sm:p-6 mb-4 sm:mb-5 space-y-4">
          <h3 className="font-medium text-surface-900 dark:text-surface-100">添加新账户</h3>
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="otp-account-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                账户名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="otp-account-name"
                name="otp-account-name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="如：username@gmail.com"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="otp-issuer" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                发行者
              </label>
              <input
                type="text"
                id="otp-issuer"
                name="otp-issuer"
                value={newAccount.issuer}
                onChange={(e) => setNewAccount({ ...newAccount, issuer: e.target.value })}
                placeholder="如：Google、GitHub"
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="otp-secret" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                密钥 (Base32) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="otp-secret"
                name="otp-secret"
                value={newAccount.secret}
                onChange={(e) => setNewAccount({ ...newAccount, secret: e.target.value })}
                placeholder="JBSWY3DPEHPK3PXP"
                className="input font-mono"
              />
              <p className="text-xs text-surface-400 mt-1">从认证器应用或网站获取的密钥，通常包含16-32个字符</p>
            </div>
            <div>
              <label htmlFor="otp-digits" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">位数</label>
              <select
                id="otp-digits"
                name="otp-digits"
                value={newAccount.digits}
                onChange={(e) => setNewAccount({ ...newAccount, digits: Number(e.target.value) })}
                className="select"
              >
                <option value={6}>6 位</option>
                <option value={7}>7 位</option>
                <option value={8}>8 位</option>
              </select>
            </div>
            <div>
              <label htmlFor="otp-period" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">周期（秒）</label>
              <select
                id="otp-period"
                name="otp-period"
                value={newAccount.period}
                onChange={(e) => setNewAccount({ ...newAccount, period: Number(e.target.value) })}
                className="select"
              >
                <option value={30}>30 秒</option>
                <option value={60}>60 秒</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-1.5 sm:gap-2">
            <button onClick={() => setShowAddForm(false)} className="btn-ghost btn-tool">
              取消
            </button>
            <button onClick={handleAddAccount} className="btn-primary btn-tool" disabled={!newAccount.name || !newAccount.secret}>
              添加
            </button>
          </div>
        </div>
      )}

      {/* 二维码显示 */}
      {selectedAccount && qrCodeDataUrl && (
        <div className="card p-4 sm:p-6 mb-4 sm:mb-5 text-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-surface-900 dark:text-surface-100">二维码</h3>
            <button onClick={() => setSelectedAccount(null)} className="btn-ghost btn-tool">
              关闭
            </button>
          </div>
          <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto rounded-xl" />
          <p className="text-sm text-surface-500 mt-3">使用 Google Authenticator 或类似应用扫描</p>
        </div>
      )}

      {/* 账户列表 */}
      {accounts.length === 0 ? (
        <div className="card p-4 sm:p-6 text-center py-12">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">暂无账户</h3>
          <p className="text-sm text-surface-500 mb-4">点击「添加账户」按钮添加您的第一个 2FA 账户</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const codeInfo = codes.find(c => c.accountId === account.id);
            return (
              <div key={account.id} className="card p-0 overflow-hidden overflow-hidden">
                <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                  {/* 进度环 */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-200 dark:text-surface-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className={`${(codeInfo?.remainingTime || 0) < 5 ? 'text-red-500' : 'text-primary-500'}`}
                        strokeDasharray={`${codeInfo?.progress || 0}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-surface-600 dark:text-surface-400">
                      {codeInfo?.remainingTime || 0}s
                    </div>
                  </div>

                  {/* 账户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-surface-900 dark:text-surface-100 truncate">
                        {account.name}
                      </h3>
                      <span className="badge bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-[10px]">
                        {account.issuer}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-mono font-bold tracking-wider text-surface-900 dark:text-surface-100">
                        {codeInfo?.code || '------'}
                      </span>
                      <button
                        onClick={() => codeInfo?.code && handleCopyCode(codeInfo.code)}
                        className={`btn-icon ${copied ? 'text-emerald-500' : ''}`}
                        disabled={!codeInfo?.code || codeInfo.code === 'ERROR'}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setSelectedAccount(selectedAccount === account.id ? null : account.id)}
                      className="btn-icon"
                      title="显示二维码"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="btn-ghost-danger btn-icon"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 功能说明 */}
      <ToolInfoAuto toolId="otp" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
