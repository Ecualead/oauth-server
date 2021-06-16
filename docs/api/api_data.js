define({ "api": [
  {
    "type": "post",
    "url": "/v1/application/:id/grant",
    "title": "Add application grant",
    "version": "2.0.0",
    "name": "AddGrantApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "post",
    "url": "/v1/application/:id/restriction",
    "title": "Add application IP address restriction",
    "version": "2.0.0",
    "name": "AddRestrictionApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "post",
    "url": "/v1/application/:id/scope",
    "title": "Add application scope",
    "version": "2.0.0",
    "name": "AddScopeApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "post",
    "url": "/v1/application/:id",
    "title": "Create new application",
    "version": "2.0.0",
    "name": "CreateApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "delete",
    "url": "/v1/application/:id",
    "title": "Delete application",
    "version": "2.0.0",
    "name": "DeleteApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "delete",
    "url": "/v1/application/:id/grant",
    "title": "Delete application grant",
    "version": "2.0.0",
    "name": "DeleteGrantApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "delete",
    "url": "/v1/application/:id/restriction",
    "title": "Delete application IP address restriction",
    "version": "2.0.0",
    "name": "DeleteRestrictionApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "delete",
    "url": "/v1/application/:id/scope",
    "title": "Delete application scope",
    "version": "2.0.0",
    "name": "DeleteScopeApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "get",
    "url": "/v1/application/:id",
    "title": "Get application information",
    "version": "2.0.0",
    "name": "FetchApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "put",
    "url": "/v1/application/:id/:action",
    "title": "Set application state",
    "version": "2.0.0",
    "name": "StatusApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "put",
    "url": "/v1/application/:id",
    "title": "Update application information",
    "version": "2.0.0",
    "name": "UpdateApplication",
    "group": "Applications",
    "filename": "src/routers/v1/application.router.ts",
    "groupTitle": "Applications"
  },
  {
    "type": "post",
    "url": "/v1/domain",
    "title": "Create new domain",
    "version": "2.0.0",
    "name": "CreateDomain",
    "group": "Domains",
    "filename": "src/routers/v1/domain.router.ts",
    "groupTitle": "Domains"
  },
  {
    "type": "delete",
    "url": "/v1/domain/:id",
    "title": "Delete a domain",
    "version": "2.0.0",
    "name": "DeleteDomain",
    "group": "Domains",
    "filename": "src/routers/v1/domain.router.ts",
    "groupTitle": "Domains"
  },
  {
    "type": "get",
    "url": "/v1/domain",
    "title": "Get curren user domains",
    "version": "2.0.0",
    "name": "FetchAllDomain",
    "group": "Domains",
    "filename": "src/routers/v1/domain.router.ts",
    "groupTitle": "Domains"
  },
  {
    "type": "get",
    "url": "/v1/domain/:id",
    "title": "Get a domain information",
    "version": "2.0.0",
    "name": "FetchDomain",
    "group": "Domains",
    "filename": "src/routers/v1/domain.router.ts",
    "groupTitle": "Domains"
  },
  {
    "type": "put",
    "url": "/v1/domain/:id/:action",
    "title": "Change the domain state",
    "version": "2.0.0",
    "name": "StatusDomain",
    "group": "Domains",
    "filename": "src/routers/v1/domain.router.ts",
    "groupTitle": "Domains"
  },
  {
    "type": "put",
    "url": "/v1/domain/:id",
    "title": "Update domain information",
    "version": "2.0.0",
    "name": "UpdateDomain",
    "group": "Domains",
    "filename": "src/routers/v1/domain.router.ts",
    "groupTitle": "Domains"
  },
  {
    "type": "get",
    "url": "/v1/oauth/external/:external/callback/failure",
    "title": "External authentication failure callback",
    "version": "2.0.0",
    "name": "ExternalAuthFailureCallbackState",
    "group": "External_Authentication",
    "filename": "src/routers/v1/external-auth.router.ts",
    "groupTitle": "External_Authentication"
  },
  {
    "type": "get",
    "url": "/v1/oauth/external/:external",
    "title": "Request external authentication",
    "version": "2.0.0",
    "name": "ExternalAuthRequest",
    "group": "External_Authentication",
    "filename": "src/routers/v1/external-auth.router.ts",
    "groupTitle": "External_Authentication"
  },
  {
    "type": "get",
    "url": "/v1/oauth/external/:external/callback",
    "title": "External authentication success callback",
    "version": "2.0.0",
    "name": "ExternalAuthSuccessCallbackState",
    "group": "External_Authentication",
    "filename": "src/routers/v1/external-auth.router.ts",
    "groupTitle": "External_Authentication"
  },
  {
    "type": "post",
    "url": "/v1/project/:id/setting/key/:obj/scope",
    "title": "Add scope to project access key",
    "version": "2.0.0",
    "name": "AddScopeKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "post",
    "url": "/v1/project/:id/setting/key",
    "title": "Register project access key",
    "version": "2.0.0",
    "name": "CreateKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "delete",
    "url": "/v1/project/:id/setting/key/:obj",
    "title": "Delete project access key",
    "version": "2.0.0",
    "name": "DeleteKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "delete",
    "url": "/v1/project/:id/setting/key/:obj/scope",
    "title": "Delete scope from project access key",
    "version": "2.0.0",
    "name": "DeleteScopeKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "get",
    "url": "/v1/project/:id/setting/key",
    "title": "Get all project access keys",
    "version": "2.0.0",
    "name": "FetchAllKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "get",
    "url": "/v1/project/:id/setting/key/:obj",
    "title": "Get project access key information",
    "version": "2.0.0",
    "name": "FetchKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/key/:obj/:action",
    "title": "Change a project access key state",
    "version": "2.0.0",
    "name": "StatusKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/key/:obj",
    "title": "Update project access key",
    "version": "2.0.0",
    "name": "UpdateKeyProjectSetting",
    "group": "Project_Access_Keys",
    "filename": "src/routers/v1/project/key.router.ts",
    "groupTitle": "Project_Access_Keys"
  },
  {
    "type": "post",
    "url": "/v1/project/:id/setting/external",
    "title": "Register external project authentication schema",
    "version": "2.0.0",
    "name": "CreateExternalProjectSetting",
    "group": "Project_External_Auth",
    "filename": "src/routers/v1/project/external-auth.router.ts",
    "groupTitle": "Project_External_Auth"
  },
  {
    "type": "delete",
    "url": "/v1/project/:id/setting/external/:obj",
    "title": "Delete external project authentication schema",
    "version": "2.0.0",
    "name": "DeleteExternalProjectSetting",
    "group": "Project_External_Auth",
    "filename": "src/routers/v1/project/external-auth.router.ts",
    "groupTitle": "Project_External_Auth"
  },
  {
    "type": "get",
    "url": "/v1/project/:id/setting/external",
    "title": "Get all external authentication schema information",
    "version": "2.0.0",
    "name": "FetchAllExternalProjectSetting",
    "group": "Project_External_Auth",
    "filename": "src/routers/v1/project/external-auth.router.ts",
    "groupTitle": "Project_External_Auth"
  },
  {
    "type": "get",
    "url": "/v1/project/:id/setting/external/:obj",
    "title": "Get external authentication schema information",
    "version": "2.0.0",
    "name": "FetchExternalProjectSetting",
    "group": "Project_External_Auth",
    "filename": "src/routers/v1/project/external-auth.router.ts",
    "groupTitle": "Project_External_Auth"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/external/:obj/:action",
    "title": "Change a external authentication state",
    "version": "2.0.0",
    "name": "StatusExternalProjectSetting",
    "group": "Project_External_Auth",
    "filename": "src/routers/v1/project/external-auth.router.ts",
    "groupTitle": "Project_External_Auth"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/external/:obj",
    "title": "Update external project authentication schema",
    "version": "2.0.0",
    "name": "UpdateExternalProjectSetting",
    "group": "Project_External_Auth",
    "filename": "src/routers/v1/project/external-auth.router.ts",
    "groupTitle": "Project_External_Auth"
  },
  {
    "type": "post",
    "url": "/v1/project/:id/setting/restriction",
    "title": "Register project restriction",
    "version": "2.0.0",
    "name": "CreateRestrictionProjectSetting",
    "group": "Project_Restrictions",
    "filename": "src/routers/v1/project/restrict-ip.router.ts",
    "groupTitle": "Project_Restrictions"
  },
  {
    "type": "delete",
    "url": "/v1/project/:id/setting/restriction/:obj",
    "title": "Delete project restriction",
    "version": "2.0.0",
    "name": "DeleteRestrictionProjectSetting",
    "group": "Project_Restrictions",
    "filename": "src/routers/v1/project/restrict-ip.router.ts",
    "groupTitle": "Project_Restrictions"
  },
  {
    "type": "get",
    "url": "/v1/project/:id/setting/restriction",
    "title": "Get all project restrictions",
    "version": "2.0.0",
    "name": "FetchAllRestrictionProjectSetting",
    "group": "Project_Restrictions",
    "filename": "src/routers/v1/project/restrict-ip.router.ts",
    "groupTitle": "Project_Restrictions"
  },
  {
    "type": "get",
    "url": "/v1/project/:id/setting/restriction/:obj",
    "title": "Get project restriction information",
    "version": "2.0.0",
    "name": "FetchRestrictionProjectSetting",
    "group": "Project_Restrictions",
    "filename": "src/routers/v1/project/restrict-ip.router.ts",
    "groupTitle": "Project_Restrictions"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/restriction/:obj/:action",
    "title": "Change a project restriction state",
    "version": "2.0.0",
    "name": "StatusRestrictionProjectSetting",
    "group": "Project_Restrictions",
    "filename": "src/routers/v1/project/restrict-ip.router.ts",
    "groupTitle": "Project_Restrictions"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/restriction/:obj",
    "title": "Update project restriction",
    "version": "2.0.0",
    "name": "UpdateRestrictionProjectSetting",
    "group": "Project_Restrictions",
    "filename": "src/routers/v1/project/restrict-ip.router.ts",
    "groupTitle": "Project_Restrictions"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/confirmation",
    "title": "Set project email confirmation",
    "version": "2.0.0",
    "name": "SettingConfirmationProject",
    "group": "Project_Settings",
    "filename": "src/routers/v1/project/setting.router.ts",
    "groupTitle": "Project_Settings"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/password",
    "title": "Set project password policy",
    "version": "2.0.0",
    "name": "SettingConfirmationProject",
    "group": "Project_Settings",
    "filename": "src/routers/v1/project/setting.router.ts",
    "groupTitle": "Project_Settings"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/setting/lifetime",
    "title": "Set project tokens lifetime",
    "version": "2.0.0",
    "name": "SettingLifetimeProject",
    "group": "Project_Settings",
    "filename": "src/routers/v1/project/setting.router.ts",
    "groupTitle": "Project_Settings"
  },
  {
    "type": "post",
    "url": "/v1/project/:id/scope",
    "title": "Add scope to project",
    "version": "2.0.0",
    "name": "AddScopeProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "post",
    "url": "/v1/project",
    "title": "Create new project",
    "version": "2.0.0",
    "name": "CreateProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "delete",
    "url": "/v1/project/:id",
    "title": "Delete a project",
    "version": "2.0.0",
    "name": "DeleteProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "delete",
    "url": "/v1/project/:id/scope",
    "title": "Delete scope from project",
    "version": "2.0.0",
    "name": "DeleteScopeProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "get",
    "url": "/v1/project",
    "title": "Get all projects of the current user for the given domain",
    "version": "2.0.0",
    "name": "FetchAllProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "get",
    "url": "/v1/project/:id",
    "title": "Get a project information",
    "version": "2.0.0",
    "name": "FetchProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "put",
    "url": "/v1/project/:id/:action",
    "title": "Change a project state",
    "version": "2.0.0",
    "name": "StatusProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "put",
    "url": "/v1/project/:id",
    "title": "Update a project information",
    "version": "2.0.0",
    "name": "UpdateProject",
    "group": "Projects",
    "filename": "src/routers/v1/project/project.router.ts",
    "groupTitle": "Projects"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/confirm",
    "title": "Confirm user account email",
    "version": "2.0.0",
    "name": "ConfirmUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/resend",
    "title": "Confirm user account email",
    "version": "2.0.0",
    "name": "ConfirmUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/logout",
    "title": "Logout the current user",
    "version": "2.0.0",
    "name": "LogoutUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "get",
    "url": "/v1/oauth/:project/profile",
    "title": "Get current user profile",
    "version": "2.0.0",
    "name": "ProfileUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "get",
    "url": "/v1/oauth/:project/profile/:id",
    "title": "Get user profile info",
    "version": "2.0.0",
    "name": "ProfileUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "get",
    "url": "/v1/oauth/:project/password",
    "title": "Change current user password",
    "version": "2.0.0",
    "name": "ProfileUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/recover/store",
    "title": "Set new password from recover process",
    "version": "2.0.0",
    "name": "RecoverStoreUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/recover/request",
    "title": "Request recover email",
    "version": "2.0.0",
    "name": "RecoverUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/recover/validate",
    "title": "Validate recover token",
    "version": "2.0.0",
    "name": "RecoverValidateUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  },
  {
    "type": "post",
    "url": "/v1/oauth/:project/register",
    "title": "Register new user account",
    "version": "2.0.0",
    "name": "RegisterUser",
    "group": "User_Accounts",
    "filename": "src/routers/v1/account.router.ts",
    "groupTitle": "User_Accounts"
  }
] });
