# Server-side, Lambda on AWS, receive form data from client through API and send notification to pre-defined email address 

var aws = require('aws-sdk');
var ses = new aws.SES({
    region: #[--------]#
});

# Parse the json event for feedback and email of the sender

exports.handler = (event, context, callback) => {

    if (event.body) {
        let body = JSON.parse(event.body)

        if (body.feedback) {
            let feedback = body.feedback;
            let Response = sendMail("Feedback Received", feedback);
            return Response;
        };
    };
};

async function sendMail(subject, data) {
    const emailParams = {
        Destination: {
            ToAddresses: [#[--------]#],
        },
        Message: {
            Body: {
                Text: {
                    Data: data
                },
            },
            Subject: {
                Data: subject
            },
        },
        Source: #[--------]#,
    };
    let response = {};
    try {
	let key = await ses.sendEmail(emailParams).promise();
        console.log("Success");
        response = {
            statusCode: 200,
            body: JSON.stringify('Ok!'),
        };
    } catch (err) {
        console.log("Error", err);
        response = {
            statusCode: 500,
            body: JSON.stringify(err),
        };
    }
    return response;
}