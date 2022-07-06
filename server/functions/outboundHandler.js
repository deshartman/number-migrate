exports.handler = async function (context, event, callback) {

    const voiceResponse = new Twilio.twiml.VoiceResponse();

    // Dial SIP URL
    voiceResponse.dial().sip(event.To + '@' + context.SIP_DOMAIN);

    return callback(null, voiceResponse);
}