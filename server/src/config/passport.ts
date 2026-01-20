import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0].value;
            if (!email) return done(new Error('No email found'), undefined);

            let user = await prisma.user.findUnique({
                where: { googleId: profile.id },
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        googleId: profile.id,
                        email: email,
                        name: profile.displayName,
                        avatar: profile.photos?.[0].value,
                    },
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err, undefined);
        }
    }
));
