const jose = require('jose')

async function computePostureScores(devices) {
  const resp = await fetch(`${EXTERNAL_SERVICE_ENDPOINT}`)
  const body = await resp.json()
  const devicePosture = body.result
  const evaluations = await evaluateDevices(devices, devicePosture)
  return evaluations
}

/**
 * Where your business logic should go.
 * Function to match external device posture checks to devices received in the request.
 * All devices in the request MUST be returned in the response
 * @param {*} devices - devices on a cloudflare account to be evaluated. See 'Request Body' in README for more details.
 * @param {*} devicePosture - Device posture checks from the third party service. 
 * @returns evaluations as a map for each device in 'devices'.
 * The key should be the Cloudflare device_id and the value should be an object consisting of an
 * external id (s2s_id) and assigned score. See 'Response Body' in README for more details.
 */
async function evaluateDevices(devices, devicePosture) {
  let evaluations = {}
  devices.forEach(device => {
    evaluations[device.device_id] =  {s2s_id: "example_external_id", score: 0}
  })
  return evaluations
}


// EVERYTHING PAST THIS SHOULD NOT NEED TO CHANGE UNLESS YOU WANT TO
// ==================================================================

addEventListener('fetch', event => {
  event.respondWith(handleExternalDevicePostureRequest(event))
})

/**
 * Top level handler for requests to this worker.
 * Requests for custom device posture integrations will come from Cloudflare.
 * Each request must contain a `Cf-Access-Jwt-Assertion` header.
 */
async function handleExternalDevicePostureRequest(event) {
  try {
    const token = event.request.headers.get('Cf-Access-Jwt-Assertion')

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing required cf authorization token' }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        },
      )
    }

    const jwks = jose.createRemoteJWKSet(new URL(`https://${TEAM_DOMAIN}/cdn-cgi/access/certs`))
    try {
      await jose.jwtVerify(token, jwks, {
        audience: `${POLICY_AUD}`
      })
    } catch (e){
      console.error(e)
      return new Response(
        JSON.stringify({ success: false, error: e.toString()}),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        },
      )
    }

    const body = await event.request.json()

    resultBody = await computePostureScores(body.devices)

    return new Response(JSON.stringify({ result: resultBody }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ success: false, error: e.toString()}),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      },
    )
  }
}
