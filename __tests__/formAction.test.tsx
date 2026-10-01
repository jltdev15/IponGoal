import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useFormAction } from '../src/services/useFormAction';
let form: ReturnType<typeof useFormAction>;
function Harness() {
  form = useFormAction();
  return null;
}
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
test('same-tick double presses execute one mutation and release the lock afterward', async () => {
  let renderer: ReactTestRenderer;
  await act(async () => {
    renderer = create(<Harness />);
  });
  let finish!: () => void;
  const action = jest.fn(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  );
  let first!: Promise<void>;
  await act(async () => {
    first = form.run(action, 'Unable to save.');
    await form.run(action, 'Unable to save.');
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(form.busy).toBe(true);
  await act(async () => {
    finish();
    await first;
  });
  expect(form.busy).toBe(false);
  await act(async () => {
    await form.run(() => {}, 'Unable to save.');
  });
  expect(form.error).toBe('');
  await act(async () => {
    renderer!.unmount();
  });
});
test('database errors are replaced with friendly text and validation errors stay useful', async () => {
  let renderer: ReactTestRenderer;
  await act(async () => {
    renderer = create(<Harness />);
  });
  await act(async () => {
    await form.run(() => {
      throw new Error('SQLITE_ERROR secret SQL');
    }, 'Unable to save your goal.');
  });
  expect(form.error).toBe('Unable to save your goal.');
  expect(form.busy).toBe(false);
  await act(async () => {
    await form.run(() => {
      throw new Error('Enter a valid amount.');
    }, 'Unable to save.');
  });
  expect(form.error).toBe('Enter a valid amount.');
  await act(async () => {
    renderer!.unmount();
  });
});
