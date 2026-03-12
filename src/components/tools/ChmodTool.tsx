import { useState, useCallback, useEffect } from 'react';
import { FileLock, Copy, Check, Terminal, RefreshCw, Shield, Users, User, Lock } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

interface PermissionState {
  owner: { read: boolean; write: boolean; execute: boolean };
  group: { read: boolean; write: boolean; execute: boolean };
  others: { read: boolean; write: boolean; execute: boolean };
  special: { setuid: boolean; setgid: boolean; sticky: boolean };
}

const initialPermissions: PermissionState = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  others: { read: true, write: false, execute: true },
  special: { setuid: false, setgid: false, sticky: false },
};

export function ChmodTool() {
  const [permissions, setPermissions] = useState<PermissionState>(initialPermissions);
  const [numericInput, setNumericInput] = useState('755');
  const [, setSymbolicInput] = useState('u=rwx,g=rx,o=rx');
  const [activeTab, setActiveTab] = useState<'visual' | 'command'>('visual');
  const { copied: copiedNum, copy: copyNum } = useClipboard();
  const { copied: copiedSym, copy: copySym } = useClipboard();
  const { copied: copiedCmd, copy: copyCmd } = useClipboard();

  // 计算数字权限
  const calculateNumeric = useCallback((perm: PermissionState): string => {
    let special = 0;
    if (perm.special.setuid) special += 4;
    if (perm.special.setgid) special += 2;
    if (perm.special.sticky) special += 1;

    const owner = (perm.owner.read ? 4 : 0) + (perm.owner.write ? 2 : 0) + (perm.owner.execute ? 1 : 0);
    const group = (perm.group.read ? 4 : 0) + (perm.group.write ? 2 : 0) + (perm.group.execute ? 1 : 0);
    const others = (perm.others.read ? 4 : 0) + (perm.others.write ? 2 : 0) + (perm.others.execute ? 1 : 0);

    return `${special}${owner}${group}${others}`;
  }, []);

  // 计算符号权限
  const calculateSymbolic = useCallback((perm: PermissionState): string => {
    const rwx = (p: { read: boolean; write: boolean; execute: boolean }) =>
      `${p.read ? 'r' : '-'}${p.write ? 'w' : '-'}${p.execute ? 'x' : '-'}`;
    return rwx(perm.owner) + rwx(perm.group) + rwx(perm.others);
  }, []);

  // 计算 chmod 命令格式
  const calculateChmodCommand = useCallback((perm: PermissionState): string => {
    const parts: string[] = [];
    
    // 所有者权限
    const ownerPerm = 
      (perm.owner.read ? 'r' : '') +
      (perm.owner.write ? 'w' : '') +
      (perm.owner.execute ? 'x' : '');
    if (ownerPerm) parts.push(`u=${ownerPerm}`);
    
    // 组权限
    const groupPerm = 
      (perm.group.read ? 'r' : '') +
      (perm.group.write ? 'w' : '') +
      (perm.group.execute ? 'x' : '');
    if (groupPerm) parts.push(`g=${groupPerm}`);
    
    // 其他用户权限
    const othersPerm = 
      (perm.others.read ? 'r' : '') +
      (perm.others.write ? 'w' : '') +
      (perm.others.execute ? 'x' : '');
    if (othersPerm) parts.push(`o=${othersPerm}`);

    let result = parts.join(',');
    
    // 特殊权限
    if (perm.special.setuid) result = `u+s,${result}`;
    if (perm.special.setgid) result = `g+s,${result}`;
    if (perm.special.sticky) result = `+t,${result}`;

    return `chmod ${result} file`;
  }, []);

  // 从数字权限解析
  const parseNumeric = useCallback((numeric: string): PermissionState | null => {
    if (!/^[0-7]{3,4}$/.test(numeric)) return null;
    
    const digits = numeric.split('').map(Number);
    const hasSpecial = digits.length === 4;
    
    const specialValue = hasSpecial ? digits[0] : 0;
    const ownerValue = hasSpecial ? digits[1] : digits[0];
    const groupValue = hasSpecial ? digits[2] : digits[1];
    const othersValue = hasSpecial ? digits[3] : digits[2];

    return {
      special: {
        setuid: (specialValue & 4) !== 0,
        setgid: (specialValue & 2) !== 0,
        sticky: (specialValue & 1) !== 0,
      },
      owner: {
        read: (ownerValue & 4) !== 0,
        write: (ownerValue & 2) !== 0,
        execute: (ownerValue & 1) !== 0,
      },
      group: {
        read: (groupValue & 4) !== 0,
        write: (groupValue & 2) !== 0,
        execute: (groupValue & 1) !== 0,
      },
      others: {
        read: (othersValue & 4) !== 0,
        write: (othersValue & 2) !== 0,
        execute: (othersValue & 1) !== 0,
      },
    };
  }, []);

  // 更新权限
  const updatePermission = (
    category: 'owner' | 'group' | 'others' | 'special',
    permission: string,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value,
      },
    }));
  };

  // 重置为默认值
  const resetPermissions = () => {
    setPermissions(initialPermissions);
  };

  // 全权限（保留供将来使用）
  // const setFullPermissions = () => {
  //   setPermissions({
  //     owner: { read: true, write: true, execute: true },
  //     group: { read: true, write: true, execute: true },
  //     others: { read: true, write: true, execute: true },
  //     special: { setuid: false, setgid: false, sticky: false },
  //   });
  // };

  // 无权限（保留供将来使用）
  // const setNoPermissions = () => {
  //   setPermissions({
  //     owner: { read: false, write: false, execute: false },
  //     group: { read: false, write: false, execute: false },
  //     others: { read: false, write: false, execute: false },
  //     special: { setuid: false, setgid: false, sticky: false },
  //   });
  // };

  // 处理数字输入
  const handleNumericInput = (value: string) => {
    setNumericInput(value);
    const parsed = parseNumeric(value);
    if (parsed) {
      setPermissions(parsed);
    }
  };

  // 同步更新输入框
  useEffect(() => {
    const numeric = calculateNumeric(permissions);
    setNumericInput(numeric);
    setSymbolicInput(calculateChmodCommand(permissions).replace('chmod ', '').replace(' file', ''));
  }, [permissions, calculateNumeric, calculateChmodCommand]);

  // 权限描述
  const getPermissionDescription = (perm: string): string => {
    const descriptions: Record<string, string> = {
      read: '读取文件内容 / 列出目录内容',
      write: '修改文件内容 / 创建删除目录中的文件',
      execute: '执行文件 / 进入目录',
      setuid: '以文件所有者身份执行',
      setgid: '以文件组身份执行 / 继承目录组',
      sticky: '仅所有者能删除目录中的文件',
    };
    return descriptions[perm] || '';
  };

  // 常用权限预设
  const presets = [
    { name: '文件 (644)', value: '0644', desc: '所有者可读写，其他只读' },
    { name: '脚本 (755)', value: '0755', desc: '所有者可读写执行，其他可执行' },
    { name: '私有 (600)', value: '0600', desc: '仅所有者可读写' },
    { name: '公开 (777)', value: '0777', desc: '所有人可读写执行' },
    { name: '上传 (733)', value: '0733', desc: 'Web 上传目录 (sticky)' },
  ];

  const symbolic = calculateSymbolic(permissions);
  const numeric = calculateNumeric(permissions);
  const chmodCommand = calculateChmodCommand(permissions);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 标题 */}
      <div className="tool-header">
        <div className="tool-icon">
          <FileLock className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            Chmod 计算
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Linux 文件权限计算，数字权限与符号权限互转
          </p>
        </div>
      </div>

      {/* 快速结果 */}
      <div className="card p-3 sm:p-6 mb-4 sm:mb-5 space-y-4">
        <div className="grid md:grid-cols-3 gap-3 sm:gap-3 sm:p-4">
          {/* 数字权限 */}
          <div className="bg-surface-50 dark:bg-surface-900/50 p-3 sm:p-4 rounded-xl border border-surface-200 dark:border-surface-700">
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2 block">
              数字权限 (Numeric)
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="text"
                value={numericInput}
                onChange={(e) => handleNumericInput(e.target.value)}
                className="flex-1 text-2xl font-mono font-bold text-surface-900 dark:text-surface-100 bg-transparent border-none outline-none"
                placeholder="0755"
                maxLength={4}
              />
              <button
                onClick={() => copyNum(numeric)}
                className={`btn-icon ${copiedNum ? 'text-emerald-500' : ''}`}
              >
                {copiedNum ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 符号权限 */}
          <div className="bg-surface-50 dark:bg-surface-900/50 p-3 sm:p-4 rounded-xl border border-surface-200 dark:border-surface-700">
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2 block">
              符号权限 (Symbolic)
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="flex-1 text-2xl font-mono font-bold text-surface-900 dark:text-surface-100">
                {symbolic}
              </span>
              <button
                onClick={() => copySym(symbolic)}
                className={`btn-icon ${copiedSym ? 'text-emerald-500' : ''}`}
              >
                {copiedSym ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chmod 命令 */}
          <div className="bg-surface-50 dark:bg-surface-900/50 p-3 sm:p-4 rounded-xl border border-surface-200 dark:border-surface-700">
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2 block flex items-center gap-1">
              <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              命令
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <code className="flex-1 text-sm font-mono text-surface-900 dark:text-surface-100 truncate">
                {chmodCommand}
              </code>
              <button
                onClick={() => copyCmd(chmodCommand)}
                className={`btn-icon ${copiedCmd ? 'text-emerald-500' : ''}`}
              >
                {copiedCmd ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-4 sm:mb-5">
        <button
          onClick={() => setActiveTab('visual')}
          className={`px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
            activeTab === 'visual'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
          可视化设置
        </button>
        <button
          onClick={() => setActiveTab('command')}
          className={`px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
            activeTab === 'command'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
          常用命令
        </button>
      </div>

      {activeTab === 'visual' && (
        <div className="space-y-5">
          {/* 预设按钮 */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleNumericInput(preset.value)}
                className="btn-secondary btn-tool"
                title={preset.desc}
              >
                {preset.name}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={resetPermissions}
              className="btn-ghost btn-tool"
            >
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
              重置
            </button>
          </div>

          {/* 权限设置表格 */}
          <div className="card p-0 sm:p-0 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-900/50">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-sm font-medium text-surface-700 dark:text-surface-300">权限对象</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-sm font-medium text-surface-700 dark:text-surface-300">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      读 (r) <span className="text-surface-400">= 4</span>
                    </span>
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-sm font-medium text-surface-700 dark:text-surface-300">
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      写 (w) <span className="text-surface-400">= 2</span>
                    </span>
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-sm font-medium text-surface-700 dark:text-surface-300">
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      执行 (x) <span className="text-surface-400">= 1</span>
                    </span>
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-sm font-medium text-surface-700 dark:text-surface-300">值</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {/* 所有者 */}
                <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/30">
                  <td className="px-3 py-3 sm:px-4 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="font-medium text-surface-900 dark:text-surface-100">所有者 (Owner)</div>
                        <div className="text-xs text-surface-500">文件的所有者用户</div>
                      </div>
                    </div>
                  </td>
                  {(['read', 'write', 'execute'] as const).map((perm) => (
                    <td key={perm} className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer group" title={getPermissionDescription(perm)}>
                        <input
                          type="checkbox"
                          checked={permissions.owner[perm]}
                          onChange={(e) => updatePermission('owner', perm, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                          permissions.owner[perm]
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-300 group-hover:border-surface-300 dark:group-hover:border-surface-600'
                        }`}>
                          {permissions.owner[perm] ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">-</span>
                          )}
                        </div>
                      </label>
                    </td>
                  ))}
                  <td className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                    <span className="text-2xl font-mono font-bold text-surface-900 dark:text-surface-100">
                      {(permissions.owner.read ? 4 : 0) + (permissions.owner.write ? 2 : 0) + (permissions.owner.execute ? 1 : 0)}
                    </span>
                  </td>
                </tr>

                {/* 组 */}
                <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/30">
                  <td className="px-3 py-3 sm:px-4 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="font-medium text-surface-900 dark:text-surface-100">所属组 (Group)</div>
                        <div className="text-xs text-surface-500">文件所属的组</div>
                      </div>
                    </div>
                  </td>
                  {(['read', 'write', 'execute'] as const).map((perm) => (
                    <td key={perm} className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer group" title={getPermissionDescription(perm)}>
                        <input
                          type="checkbox"
                          checked={permissions.group[perm]}
                          onChange={(e) => updatePermission('group', perm, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                          permissions.group[perm]
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-300 group-hover:border-surface-300 dark:group-hover:border-surface-600'
                        }`}>
                          {permissions.group[perm] ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">-</span>
                          )}
                        </div>
                      </label>
                    </td>
                  ))}
                  <td className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                    <span className="text-2xl font-mono font-bold text-surface-900 dark:text-surface-100">
                      {(permissions.group.read ? 4 : 0) + (permissions.group.write ? 2 : 0) + (permissions.group.execute ? 1 : 0)}
                    </span>
                  </td>
                </tr>

                {/* 其他用户 */}
                <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/30">
                  <td className="px-3 py-3 sm:px-4 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 bg-surface-100 dark:bg-surface-700 rounded-lg flex items-center justify-center">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-surface-600 dark:text-surface-400" />
                      </div>
                      <div>
                        <div className="font-medium text-surface-900 dark:text-surface-100">其他用户 (Others)</div>
                        <div className="text-xs text-surface-500">系统中的其他所有用户</div>
                      </div>
                    </div>
                  </td>
                  {(['read', 'write', 'execute'] as const).map((perm) => (
                    <td key={perm} className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer group" title={getPermissionDescription(perm)}>
                        <input
                          type="checkbox"
                          checked={permissions.others[perm]}
                          onChange={(e) => updatePermission('others', perm, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                          permissions.others[perm]
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-300 group-hover:border-surface-300 dark:group-hover:border-surface-600'
                        }`}>
                          {permissions.others[perm] ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">-</span>
                          )}
                        </div>
                      </label>
                    </td>
                  ))}
                  <td className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                    <span className="text-2xl font-mono font-bold text-surface-900 dark:text-surface-100">
                      {(permissions.others.read ? 4 : 0) + (permissions.others.write ? 2 : 0) + (permissions.others.execute ? 1 : 0)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table></div>
          </div>

          {/* 特殊权限 */}
          <div className="card p-3 sm:p-6 space-y-4">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-red-500" />
              特殊权限 (Setuid/Setgid/Sticky)
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 sm:gap-3 sm:p-4">
              {[
                { key: 'setuid', label: 'Setuid (4)', desc: '以所有者身份执行', icon: User },
                { key: 'setgid', label: 'Setgid (2)', desc: '以组身份执行/继承组', icon: Users },
                { key: 'sticky', label: 'Sticky (1)', desc: '仅所有者能删除', icon: Shield },
              ].map(({ key, label, desc, icon: Icon }) => (
                <label
                  key={key}
                  className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    permissions.special[key as keyof typeof permissions.special]
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.special[key as keyof typeof permissions.special]}
                    onChange={(e) => updatePermission('special', key, e.target.checked)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      permissions.special[key as keyof typeof permissions.special]
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                    }`}>
                      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-surface-900 dark:text-surface-100">{label}</div>
                      <div className="text-xs text-surface-500 mt-0.5">{desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 权限说明 */}
          <div className="card p-3 sm:p-6 space-y-3">
            <h3 className="font-medium text-surface-900 dark:text-surface-100">权限说明</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">r</span>
                <span className="text-surface-600 dark:text-surface-400">读取文件内容 / 列出目录</span>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">w</span>
                <span className="text-surface-600 dark:text-surface-400">修改文件 / 创建删除文件</span>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">x</span>
                <span className="text-surface-600 dark:text-surface-400">执行文件 / 进入目录</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'command' && (
        <div className="space-y-5">
          {/* 常用命令参考 */}
          <div className="card p-3 sm:p-6 space-y-4">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
              <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-primary-500" />
              常用 Chmod 命令
            </h3>
            <div className="space-y-3">
              {[
                { cmd: 'chmod 755 script.sh', desc: '设置脚本可执行权限（推荐）' },
                { cmd: 'chmod 644 file.txt', desc: '设置普通文件权限（推荐）' },
                { cmd: 'chmod 600 secret.key', desc: '设置私有文件权限' },
                { cmd: 'chmod 777 shared/', desc: '设置完全开放权限（慎用）' },
                { cmd: 'chmod -R 755 /var/www', desc: '递归设置目录权限' },
                { cmd: 'chmod u+x file', desc: '给所有者添加执行权限' },
                { cmd: 'chmod go-w file', desc: '移除组和其他人的写权限' },
                { cmd: 'chmod +t /tmp', desc: '设置 Sticky Bit（如 /tmp 目录）' },
                { cmd: 'chmod u+s binary', desc: '设置 Setuid 位' },
                { cmd: 'chmod g+s directory', desc: '设置 Setgid 位（目录继承组）' },
              ].map(({ cmd, desc }, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-900/50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <code className="text-sm font-mono text-primary-600 dark:text-primary-400">{cmd}</code>
                    <span className="text-sm text-surface-500">{desc}</span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(cmd)}
                    className="btn-icon"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 数字权限速查表 */}
          <div className="card p-3 sm:p-6 space-y-4">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-emerald-500" />
              数字权限速查表
            </h3>
            <div className="overflow-x-auto">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-surface-50 dark:bg-surface-900/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-surface-700 dark:text-surface-300">数字</th>
                    <th className="px-4 py-2 text-left font-medium text-surface-700 dark:text-surface-300">权限</th>
                    <th className="px-4 py-2 text-left font-medium text-surface-700 dark:text-surface-300">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  <tr><td className="px-4 py-2 font-mono">0</td><td className="px-4 py-2 font-mono">---</td><td className="px-4 py-2 text-surface-500">无权限</td></tr>
                  <tr><td className="px-4 py-2 font-mono">1</td><td className="px-4 py-2 font-mono">--x</td><td className="px-4 py-2 text-surface-500">仅执行</td></tr>
                  <tr><td className="px-4 py-2 font-mono">2</td><td className="px-4 py-2 font-mono">-w-</td><td className="px-4 py-2 text-surface-500">仅写入</td></tr>
                  <tr><td className="px-4 py-2 font-mono">3</td><td className="px-4 py-2 font-mono">-wx</td><td className="px-4 py-2 text-surface-500">写入和执行</td></tr>
                  <tr><td className="px-4 py-2 font-mono">4</td><td className="px-4 py-2 font-mono">r--</td><td className="px-4 py-2 text-surface-500">仅读取</td></tr>
                  <tr><td className="px-4 py-2 font-mono">5</td><td className="px-4 py-2 font-mono">r-x</td><td className="px-4 py-2 text-surface-500">读取和执行</td></tr>
                  <tr><td className="px-4 py-2 font-mono">6</td><td className="px-4 py-2 font-mono">rw-</td><td className="px-4 py-2 text-surface-500">读取和写入</td></tr>
                  <tr><td className="px-4 py-2 font-mono">7</td><td className="px-4 py-2 font-mono">rwx</td><td className="px-4 py-2 text-surface-500">全部权限</td></tr>
                </tbody>
              </table></div>
            </div>
          </div>
        </div>
      )}

      <AdFooter />
    </div>
  );
}
