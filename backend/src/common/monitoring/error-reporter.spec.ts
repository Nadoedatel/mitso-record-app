import { reportError, resetErrorReporter, setErrorReporter } from './error-reporter';

describe('error reporter', () => {
  afterEach(() => resetErrorReporter());

  it('does nothing by default', () => {
    expect(() => reportError(new Error('x'))).not.toThrow();
  });

  it('forwards the error and context to the installed reporter', () => {
    const capture = jest.fn();
    setErrorReporter({ capture });
    const error = new Error('boom');

    reportError(error, { requestId: 'r1', userId: 7 });

    expect(capture).toHaveBeenCalledWith(error, { requestId: 'r1', userId: 7 });
  });

  it('swallows a failing reporter so monitoring can never break a response', () => {
    setErrorReporter({
      capture: () => {
        throw new Error('sentry is down');
      },
    });

    expect(() => reportError(new Error('x'))).not.toThrow();
  });
});
