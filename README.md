# Dmart

A TypeScript implementation of the Dmart that depends on axios.

# Setup

make sure you define `axiosDmartInstance` with your axios instance before importing the Dmart class.


## APIs
* `setAxiosInstance(axiosInstance: AxiosInstance)` - Sets the axios instance to be used by the Dmart class.
* `getAxiosInstance() -> AxiosInstance` - Gets the axios instance used by the Dmart class.
* `getBaseUrl() -> string` - Gets the base URL of the Dmart instance.
* `setBaseUrl(baseUrl: string)` - Sets the base URL of the Dmart instance.
* `getHeaders()` - Gets the headers used by the Dmart instance.
* `setHeaders(headers: Record<string, string>)` - Sets the headers used by the Dmart instance.
* `getToken() -> string | null` - Gets the token used by the Dmart instance.
* `setToken(token: string)` - Sets the token used by the Dmart instance.
* `login(shortname: string, password: string) -> Promise<LoginResponse>` - Performs a login action (shortname).
* `loginBy(credentials: dict, password: string) -> Promise<LoginResponse>` - Performs a login action but altering the default identifier that you can customise.
* `logout() -> Promise<ApiResponse>` - Performs a logout action.
* `otpRequest(request: SendOTPRequest, acceptLanguage: string | null = null) -> Promise<ApiResponse>` - Requests an OTP (One Time Password) for login.
* `otpRequestLogin(request: SendOTPRequest, acceptLanguage: string | null = null) -> Promise<ApiResponse>` - Requests an OTP for login and returns a login response.
* `passwordResetRequest(request: PasswordResetRequest) -> Promise<ApiResponse>` - Requests a password reset.
* `confirmOtp(request: ConfirmOTPRequest) -> Promise<ApiResponse>` - Confirms the OTP (One Time Password) for login or password reset.
* `userReset(shortname: string) -> Promise<ApiResponse>` - Resets the user password by sending an OTP to the user's email.
* `validatePassword(password: string) -> Promise<ApiResponse>` - Validates the password.
* `createUser(request: ActionRequestRecord) -> Promise<ActionResponse>` - Creates a new user.
* `updateUser(request: ActionRequestRecord) -> Promise<ActionResponse>` - Updates an existing user.
* `checkExisting(prop: string, value: string) -> Promise<ResponseEntry>` - Checks if a user exists.
* `getProfile() -> Promise<ProfileResponse>` - Gets the profile of the current user.
* `query(query: QueryRequest) -> Promise<ApiQueryResponse | null>` - Performs a query action.
* `csv(query: any) -> Promise<ApiQueryResponse>` - Query the entries as csv file.
* `space(action: ActionRequest) -> Promise<ActionResponse>` - Performs actions on spaces.
* `request(action: ActionRequest) -> Promise<ActionResponse>` - Performs a request action.
* `retrieveEntry(request: RetrieveEntryRequest, scope: string = "managed") -> Promise<ResponseEntry | null>` - Performs a retrieve action.
* `uploadWithPayload(request: UploadWithPayloadRequest, scope: string = "managed") -> Promise<ApiResponse>` - Uploads a file with a payload.
* `fetchDataAsset(request: FetchDataAssetRequest) -> Promise<any>` - Fetches a data asset.
* `getSpaces() -> Promise<ApiResponse | null>` - Gets the spaces (user query).
* `getChildren(request: GetChildrenRequest) -> Promise<ApiResponse | null>` - Gets the children of a space (user query).
* `getAttachmentUrl(request: GetAttachmentURLRequest, scope: string = "managed") -> string` - Constructs the URL of an attachment.
* `getSpaceHealth(space_name: string) -> Promise<ApiQueryResponse & { attributes: { folders_report: Object } }>` - Gets the health check of a space.
* `getPayload(request: GetPayloadRequest, scope: string = "managed") -> Promise<any>` - Gets the payload of a resource.
* `progressTicket(request: ProgressTicketRequest) -> Promise<ApiQueryResponse & { attributes: { folders_report: Object } }>` - Performs a progress ticket action.
* `submit(request: SubmitRequest) -> Promise<any>` - Submits a record (log/feedback) to Dmart.
* `getManifest() -> Promise<any>` - Gets the manifest of the current instance.
* `getSettings() -> Promise<any>` - Gets the settings of the current instance.

# Usage

* Initialize the Dmart instance:
```js
export const dmartAxios = axios.create({
    baseURL: backendURL,
    withCredentials: true,
});
Dmart.setAxiosInstance(dmartAxios);
```

## Manage user

* Create user
```ts
const createUserRequest: ActionRequest = {
    space_name: 'users',
    request_type: RequestType.create,
    records: [
        {
            resource_type: ResourceType.user,
            shortname: 'john_doe', // auto: for auto-generated shortname
            attributes: {
                password: 'my-password',
                is_active: true,
                // email, msisdn, displayname are optional
                email: 'john_doe@example.com',
                msisdn: '1234567890',
                password: 'securePassword123',
                displayname: {en: 'John Doe'},
                // roles is optional
                roles: ['store_manager'],
                // is_msisdn_verified, is_email_verified are optional
                is_msisdn_verified: true,
                is_email_verified: true,
                // is force_password_change is optional
                is_force_password_change: false,
                // payload is optional
                payload: {
                    content_type: 'json',
                    body: {
                        additional_info: 'This is some additional information about the user.'
                    }
                }
            }
        }
    ]
};

const response = await Dmart.createUser(createUserRequest.records[0]);
```

* Login with credentials

```ts
const response = await Dmart.login('john_doe', 'securePassword123');

loginBy({email: 'john_doe@example.com'}, 'securePassword123');

loginBy({msisdn: '1234567890'}, 'securePassword123');
```

* Get user profile

```ts
const profileResponse = await Dmart.getProfile();
```

* Update user

```ts
const updateUserRequest: ActionRequest = {
    space_name: 'users',
    request_type: RequestType.update,
    records: [
        {
            resource_type: ResourceType.user,
            shortname: 'john_doe',
            attributes: {
                payload: {
                    content_type: 'json',
                    body: {
                        'rotation': 'bi-weekly'
                    }
                }
            }
        }
    ]
};

const response = await Dmart.updateUser(updateUserRequest.records[0]);
```

## Managing entries

* Create entry

```ts
const createRequest: ActionRequest = {
    space_name: 'test_space',
    request_type: RequestType.create,
    records: [
        {
            resource_type: ResourceType.content,
            subpath: '/dummies',
            shortname: 'dummy_001',
            attributes: {
                payload: {
                    content_type: 'json',
                    body: {
                        title: 'Test Dummy Entry',
                        description: 'This is a test dummy entry',
                        status: 'active'
                    }
                }
            }
        }
    ]
};
const response = await Dmart.request(createRequest);
```

* Update entry

```ts
const updateRequest: ActionRequest = {
    space_name: 'test_space',
    request_type: RequestType.update,
    records: [
        {
            resource_type: ResourceType.content,
            subpath: '/dummies',
            shortname: 'dummy_001',
            attributes: {
                payload: {
                    content_type: 'json',
                    body: {
                        status: 'unactive'
                    }
                }
            }
        }
    ]
};
const response = await Dmart.request(createRequest);
```

* Delete entry

```ts
const deleteRequest: ActionRequest = {
    space_name: 'test_space',
    request_type: RequestType.delete,
    records: [
        {
            resource_type: ResourceType.content,
            subpath: '/dummies',
            shortname: 'dummy_001',
            attributes: {}
        }
    ]
};
const response = await Dmart.request(createRequest);
```
