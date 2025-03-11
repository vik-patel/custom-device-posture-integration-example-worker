const jose = require('jose')

async function computePostureScores(devices) {
  //console.log(devices)
  let evaluations = {}
  devices.forEach(device => {
    evaluations[device.device_id] =  {s2s_id: device.device_id, score: getRndInteger(`${MIN_SCORE},${MAX_SCORE}`)}
  })
  //console.log(evaluations)
  return evaluations
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
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
