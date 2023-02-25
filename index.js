const express = require('express')
const app = express();
const port = 3900;
const cors = require('cors');
const apiRoutes = express.Router();
const auth = require('./Routes/authRoutes');
const bodyParser = require('body-parser');
const dbConnection = require('./dbConnection');
const { OAuth2Client } = require('google-auth-library');
app.use(express.json())
app.use(cors())
app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);
let db;

// const verify = async () => {
//     try {
//         // let token = "ya29.a0AVvZVsoW4kqajR8MTxMNBnhlV_9zRzMJBFS0u59lt9A1cauexwPPvSL75hjdYULmtqClhrO1kBMvHb_qibI8VlR1AYcDHtLzv2gzeS-zL-J7Wz7a6WbUf-jEnCpYWFMkuNuTt3O7l0_GS_eOd3i_f3xLilGElwaCgYKAUISARMSFQGbdwaIo1UCmgRbAePHIlDU5tfY8w0165"
//         let token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQyNWY4ZGJjZjk3ZGM3ZWM0MDFmMDE3MWZiNmU2YmRhOWVkOWU3OTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjg5NzA0NjM2NjA0LWRtYTUxcjZudjRvc3BnMml0Y2llNWkzbDM2bjNsZGo1LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjg5NzA0NjM2NjA0LWRtYTUxcjZudjRvc3BnMml0Y2llNWkzbDM2bjNsZGo1LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA4MjgxNTMwNTM4NTEyMjg3NDIxIiwiZW1haWwiOiJwcmVta3VtYXIuMjMxOTk2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiSG0ta1NRZ01fM3FmbzRSUkFvVlJDZyIsIm5hbWUiOiJQcmVta3VtYXIgUGVudGFwYXRpIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eFp3aHhnanFfOVhKQkZwVExJU1NBejZua0ZjSUpMT1FJYWd0TklXZGRNPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlByZW1rdW1hciIsImZhbWlseV9uYW1lIjoiUGVudGFwYXRpIiwibG9jYWxlIjoiZW4tR0IiLCJpYXQiOjE2NzczMTAyOTcsImV4cCI6MTY3NzMxMzg5NywianRpIjoiZGFlNjFlZmRlOGYyNDY3ZTJjZDhlMGE2M2EzZWM3ZDdiZjM0N2I1MiJ9.sngi8d014SKb2zQJNvXtn8hF6WhKbUt9hA3mgFs6ADaYrLR2LYeGjhhB3vqNnOsIIEA_6qgxeEVcKbEfY57_q2qo7hVlgiR84KoJSiv-t3BKspHwzsNecQXLLOpJdCaVDfd8mZTioOpWEvp0f8Ih3Xdz_V_dEhVB2fvCxs9uaV7Ph_Vlk0Zrf1hOOam36rz1EAjrm4p-RWQ4mAllftgsecf5YgKAMYrCjMKLSkTuWYtgpDNHpFIpJaGiQd0WQ2LyaEIY7_bnOPlZM7IL_vVGEShLy4fSwwuBjGgKMdWISUQHe8ikkJ88G7VGufEdoDBMyWnmggQpu8sLkJRHhoYzhw"
//         const CLIENT_ID = '289704636604-dma51r6nv4ospg2itcie5i3l36n3ldj5.apps.googleusercontent.com'; // Replace with your own client ID
//         const client = new OAuth2Client(CLIENT_ID);
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: CLIENT_ID,
//         });
//         const payload = ticket.getPayload();
//         return payload;
//     } catch (err) {
//         console.error(err);
//         return null;
//     }
// }

dbConnection().then(async val => {
    // let check = await verify()
    // console.log(check, 3);
    db = val
}).catch(err => {
    console.log(err);
})

// const accessToken1 = "ya29.a0AVvZVsoW4kqajR8MTxMNBnhlV_9zRzMJBFS0u59lt9A1cauexwPPvSL75hjdYULmtqClhrO1kBMvHb_qibI8VlR1AYcDHtLzv2gzeS-zL-J7Wz7a6WbUf-jEnCpYWFMkuNuTt3O7l0_GS_eOd3i_f3xLilGElwaCgYKAUISARMSFQGbdwaIo1UCmgRbAePHIlDU5tfY8w0165"

// fetch('https://www.googleapis.com/drive/v3/files', {
//   headers: {
//     Authorization: `Bearer ${accessToken1}`,
//   },
// })
//   .then(response => {
//     // Handle the response
//     console.log(response, 'hiiiii');
//   })
//   .catch(error => {
//     // Handle the error
//     console.error(error, 'byeeeee');
//   });
// In this example, we include the access token in the Authorization header of the HTTP request using template literals. We then send the request to the Google Drive API endpoint to list the files in the user's drive. The response from the API will be logged to the console. If there is an error, it will also be logged to the console.






app.use((req, res, next) => {
    // console.log(req.body, 'hiiii123');
    if (!db) {
        dbConnection().then(val => {
            db = val;
            req.mongoConnection = db
            next()
        }).catch(err => {
            console.log(err);
            res.send({ success: false, error: "Mongo Error!" });
        })
    } else {
        req.mongoConnection = db;
        next()
    }
})
apiRoutes.use('/auth', (req, res, next) => {
    // console.log(req.body, 'hiii');
    next()
}, auth)
app.use(apiRoutes)
app.get('/', (req, res) => {
    res.send('hello world')
})



app.listen(port, () => {
    console.log('server running on port:' + port);
})
