import { useRef, useState } from 'react';
export function useFormAction() {
  const lock = useRef(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function run(action: () => void | Promise<void>, fallback: string) {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      const friendly =
        /^(Please|Enter|Use a password|Your passwords|Username must|This username|Incorrect username|Total tracked|Restore this|Goal not found|Savings entry not found|Reach your target)/.test(
          message,
        );
      setError(friendly ? message : fallback);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, run };
}
