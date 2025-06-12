
export const Config = {
  client: {
    baseURL: "http://localhost:8282",
    queryTimeout: 3000
  },
  Storage: {
    authKey: "user",
    Timeout: 24, // hours
    Key: "dmart.cache",
    ResetKey: "20250606",
  },
  API: {
    rootPath: '__root__',
    rootSpace: 'management',
    auth: {
      login: '/user/login',
      logout: '/user/logout',
      profile: '/user/profile'
    },
    resource: {
      query: '/:scope/query',
      csv: '/managed/csv',
      request: '/:scope/request',
      // path is optional
      submit: '/public/submit/:space/:path:schema/:subpath',
    },
    entry: {
      existing: '/user/check-existing?:options',
      details: '/:scope/entry/:resource/:space/:subpath/:shortname?:options',
    },
    payload: {
      file: '/:scope/resource_with_payload',
      files: '/:scope/resource_with_payload',
      // schema is optional
      url: '/:scope/payload/:resource/:space/:subpath/:shortname.:schema:ext'
    },
    asset: {
      request: '/managed/data-asset'
    },
    info: {
      health: '/managed/health/:space',
      settings: '/info/settings',
      manifest: '/info/manifest'
    },
    ticket: {
      progress: '/managed/progress-ticket/:space/:subpath/:shortname/:action'
    }
  }
};

