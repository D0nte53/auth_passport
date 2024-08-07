import createHttpError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import session from 'express-session';
import passport from 'passport'
import  {Strategy} from 'passport-google-oauth2'
import logger from "morgan";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const refreshTokenProps = {accessType: 'offline',prompt: 'consent'}

passport.use("oauth2-1",new Strategy({
   ...refreshTokenProps,
   clientSecret:process.env.CLIENT_SECRET,
   authorizationURL:"https://accounts.google.com/o/oauth2/auth",
   tokenURL:"https://accounts.google.com/o/oauth2/token",
   clientID:process.env.CLIENT_ID,
   callbackURL:`http://localhost:3000${process.env.CALLBACK_URL}`,
   scope: ["https://www.googleapis.com/auth/userinfo.email","https://www.googleapis.com/auth/userinfo.profile"]//,"https://www.googleapis.com/auth/calendar","https://www.googleapis.com/auth/calendar.events"]
}
  , function (accessToken, refreshToken,params, profile, cb){
    console.log("write")
    fs.writeFileSync('token.json',JSON.stringify({accessToken,refreshToken,params:JSON.stringify(params),profile:JSON.stringify(profile)}));
    return cb(null, profile);
  }
));


passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/',
  passport.authenticate("oauth2-1",{
   ...refreshTokenProps
}));


app.get(
  process.env.CALLBACK_URL,
  passport.authenticate("oauth2-1", { failureRedirect: "/auth/google/failure" ,...refreshTokenProps}),

  function (req, res) {
    console.log("CALLBACK")
    res.redirect("/auth/google/success");
  }
);


app.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate..');
});

app.get('/auth/google/success', (req, res) => {
  res.send('Success authentication');
});

app.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('Goodbye!');
});


app.listen(
     3000,
    () => console.log(`Server is running on port ${3000}`)
)

export default app;