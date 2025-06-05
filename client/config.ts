
export const Config = {
  client: {

    baseURL: "http://localhost:8282",
    headers: {
      "Content-type": "application/json",
      "Authorization": "",
    }
  },
  API: {
    rootPath: '__root__',
    rootSpace: 'management',
    auth: {
      login: '/user/login',
    },
    profile: {
      details: '/user/profile'
    }
    , space: {
      list: '/:scope/query',
      details: '/:scope/entry/space/:space/__root__/:space',
      create: '/:scope/space',
    }
    , resource: {
      query: '/:scope/query',
      details: '/:scope/entry/:resource/:space/:subpath/:shortname?:options',
      request: '/:scope/request',
      submit: '/:scope/submit'
    }
  }
};

