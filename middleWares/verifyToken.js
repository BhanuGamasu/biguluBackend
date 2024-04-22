const { OAuth2Client } = require('google-auth-library');
const token = require('./tokenValidator');
const { GridFSBucket } = require('mongodb');
const { ObjectId } = require('mongodb');


const middleWares = {
  verify: async (req, res, next) => {
    try {
      const decodeInfo = await token.decodeToken(req.headers);
      if (decodeInfo){
        let user = await req.mongoConnection.collection('users').find({email: decodeInfo.email}).toArray();
        if (user.length > 0) {
          req.decodeInfo = user[0];
          next()
        } else {
          res.status(401).send({success: false, code: 401, message: 'user not found'});
        }
      } else {
        res.status(401).send({success: false, code: 401, message: 'Invalid Authorization'});
      }
    } catch(err) {
      res.status(500).send({success: false, code: 500, data: err, message: 'Invalid Authorization'})
    }
  },
}

module.exports = middleWares;

  //   verifyToken: async(req, res) => {
  //       try{
  //           const CLIENT_ID = 'your_client_id_here'; // Replace with your own client ID
  // const client = new OAuth2Client(CLIENT_ID);
  // const ticket = await client.verifyIdToken({
  //   idToken: token,
  //   audience: CLIENT_ID,
  // });
  // const payload = ticket.getPayload();
  // return payload;
  //       } catch(err) {
  //           console.error(error);
  //   return null;
  //       }
  //   }
// async function verifyToken(token) {
//   const CLIENT_ID = 'your_client_id_here'; // Replace with your own client ID
//   const client = new OAuth2Client(CLIENT_ID);

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: CLIENT_ID,
//     });
//     const payload = ticket.getPayload();
//     return payload;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

// // Example usage
// const token = 'authentication_data_here'; // Replace with the actual authentication data
// const payload = await verifyToken(token);
// if (payload) {
//   // The authentication data is valid, proceed with granting access to the user
// } else {
//   // The authentication data is invalid or expired, reject the user's request
// }
// // In this example, we create a new OAuth2Client instance using our own Google API client ID. We then call the verifyIdToken method of the OAuth2Client instance and pass it the authentication data received from the user's device. If the authentication data is valid, the method will return a ticket object containing the user's identity information. Otherwise, the method will throw an error, and we can handle the error accordingly. Finally, we return the user's identity information in the payload object for further processing.




