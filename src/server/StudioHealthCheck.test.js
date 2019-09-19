const StudioHealthCheck = require('./StudioHealthCheck');

describe('StudioHealthCheck', () => {
  test('should init when parameter is given in parameter', () => {
    let healthCheck = new StudioHealthCheck('myCustomEndPoint/status', 64027);
    expect(healthCheck.port).toBe(64027);
    expect(healthCheck.workspaceApiUrl).toBe('myCustomEndPoint/status');
  });
});
