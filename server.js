import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcrypt';
import session from 'express-session'; 
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;
let revokedTokens = [];

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
});

app.use(express.json());
app.use("/api/", apiLimiter);
app.use(session({
    secret: 'JrFHRr3LPEHDvs6ixYGky',
    resave: false,
    saveUninitialized: false
}));

const users = [
    { id: 1, username: 'admin', password: '$2b$10$JrFHRr3LPEHDvs6ixYGky.3vyRExLBcM9XLt.de/jo9Z5zOG.OU6e' } // senha: "password"
];

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(user => user.id === id);
    done(null, user);
});

passport.use(new LocalStrategy(
    async (username, password, done) => {

        try {
            const user = users.find(u => u.username === username);

            if (!user) {
                return done(null, false, { message: 'Nome de usuário inválido.' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return done(null, false, { message: 'Senha inválida.' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

app.use(passport.initialize());
app.use(passport.session());

app.post('/api/login', passport.authenticate('local'), (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, 'secreto', { expiresIn: '1h' });
    res.json({ message: 'Login bem-sucedido', token: token });
});

app.get('/api/authenticated', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/revoketoken', (req, res) => {
    const { token } = req.body;

    if (revokedTokens.includes(token)) {
        return res.status(400).json({ message: 'O token já foi revogado.' });
    }

    revokedTokens.push(token);

    return res.json({ message: 'Token revogado com sucesso.' });
});


app.get('/api/data', (req, res) => {
    const data = { message: 'Dados da API RESTful' };
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Servidor API rodando na porta ${PORT}`);
});
