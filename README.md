# Custom Device Posture Integration Example Worker

This repository contains framework to allow admins to quickly setup an Access protected worker for custom device posture integrations. Additional information about this feature can be found in the [Cloudflare Developer Docs](https://developers.cloudflare.com/cloudflare-one/identity/devices/service-providers/).

## Setup

1. Update `wrangler.toml` with the values for your account.
2. Update the `evaluateDevices` function in `index.js` with your business logic. Other functions may be updated if desired.
3. Run `npm install`.
4. Run `wrangler deploy`.
5. In the [Zero Trust Dashboard](https://one.dash.cloudflare.com) add the worker as an Access application. For additional information please refer to [Web applications in Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/).
6. Configure an Access policy for your worker making sure to include your Access service token.
7. Update `POLICY_AUD` in `wrangler.toml` with the [Application Audience (AUD) Tag](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/#get-your-aud-tag) of your Access application and redeploy your worker.
8. You can now create a custom device posture integration using your Access service token credentials!

## Request Body

The request body from Cloudflare will contain a list of devices with identifying information to distinguish each device. The list of possible identifying information fields are: `device_id`, `email`, `serial_number`, `mac_address`, `virtual_ipv4`, and `hostname`. Every device in the request body will always contain the Cloudflare `device_id`. A maximum of 1000 devices will be sent per a request.

Example Request Body:

```
{
  "devices": {
    [
      {
        "device_id": "string",
        "email": "string",
        "serial_number": "string",
        "mac_address": "string",
        "virtual_ipv4": "string",
        "hostname": "string",
      }
    ]
  }
}
```

## Response Body

The response body must contain a `result` field which must contain a map with the Cloudflare `device_id` as the key and an device evaluation as the value. Each evaluation must have an `s2s_id` (an external id) and a `score` (a value between 0-100). There must be a key and evaluation of each device provided in the request body.

The `s2s_id` will help identify the evaluation that was matched to each Cloudflare device. This will be visible through device posture checks and logs in the Zero Trust Dashboard.

Example Response Body:

```
{
    "result": {
        "device_id1": {
            "s2s_id": "external_id_1",
            "score": 10
        },
        "device_id2": {
            "s2s_id": "external_id_2",
            "score": 50
        },
        "device_id3": {
            "s2s_id": "external_id_3",
            "score": 100
        }
    }
}
```

For more details on the expect request and response body, see the [mock spec](spec.yaml)

## Debugging

Run `wrangler tail -f pretty` to get basic debug logs for your worker.