import express from "express";
import mysql from "mysql";
import bcrypt from "bcryptjs";

const port = process.env.PORT || 3030;
const passwordSaltRounds = 10;
const minPasswordLength = 6;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const isBcryptHash = (password) => {
    return typeof password === 'string' && /^\$2[aby]\$\d{2}\$/.test(password);
};

const validateEmail = (email) => {
    return emailRegex.test(email);
};

const validateSignupPassword = (password) => {
    return typeof password === 'string' && password.length >= minPasswordLength;
};

const con = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'BlockChain'
});

con.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.stack);
        process.exit(1);
    }
    console.log('Conexão bem-sucedida ao banco de dados');
});

//
const app = express();
app.use(express.json());
app.use(express.static('./public'));
app.use(express.static('./script'));


//pega o imput da imagem e insere tabele imagem;
app.post('/rota', (req, res) => {
    console.log("Chegou aqui na rota /rota");

   const { latitude, longitude, link, value, addressWallet, drone, ImageDescription, usuario_id } = req.body;
  
   if (latitude !== undefined && longitude !== undefined) {
        
        const droneManufacturer = drone;
        const a = ImageDescription;  
        let imageDescription=a;


        // CORREÇÃO: Incluindo 'value', 'link' e 'AndresWallet' na query SQL
const sql = `
    INSERT INTO Image (description, drone_manufacturer, location_lat, location_lon, registrationdata, value, link, AndresWallet, usuario_id)
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)
`;

con.query(sql, [imageDescription, droneManufacturer, latitude, longitude, value, link, addressWallet, usuario_id], (err, result) => {
            if (err) {
                console.error('Erro ao inserir coordenadas no banco de dados:', err);
                return res.status(500).json({ message: 'Erro ao salvar coordenadas no banco de dados.' });
            }
            console.log('Coordenadas inseridas com sucesso na tabela Image! ID:', result.insertId);
            res.status(200).json({
                message: 'Dados de latitude e longitude recebidos e salvos com sucesso!',
                data: { latitude, longitude, insertedId: result.insertId }
            });
        });

    } else {
        res.status(400).json({ message: 'Dados de latitude ou longitude ausentes na requisição.' });
    }
});

//
app.get('/imagens-por-area', (req, res) => {

    const { latMin, latMax, lngMin, lngMax } = req.query;

    if (
        latMin === undefined || latMax === undefined ||
        lngMin === undefined || lngMax === undefined ||
        isNaN(parseFloat(latMin)) || isNaN(parseFloat(latMax)) ||
        isNaN(parseFloat(lngMin)) || isNaN(parseFloat(lngMax))
    ) {
        return res.status(400).json({ message: 'Parâmetros de coordenadas (latMin, latMax, lngMin, lngMax) são obrigatórios e devem ser números.' });
    }

     //pegando as latitude e longitudess=
    const minLat = parseFloat(latMin);//13
    const maxLat = parseFloat(latMax);//15
    const minLng = parseFloat(lngMin);//39
    const maxLng = parseFloat(lngMax);//41

    const sql = `
        SELECT * FROM Image
        WHERE location_lat BETWEEN ? AND ?
          AND location_lon BETWEEN ? AND ?
    `;

    con.query(sql, [minLat, maxLat, minLng, maxLng], (err, results) => {
        if (err) {
            console.error('Erro ao buscar imagens:', err);
            return res.status(500).json({ message: 'Erro no banco de dados.' });
        }

        console.log("Resultados encontrados:", results); // <-- Aqui imprime no terminal

        res.status(200).json(results);
    });
});

app.post('/login', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!validateEmail(email) || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'Email ou senha inválidos' });
  }

  con.query('SELECT idusuarios, password FROM usuarios WHERE email = ?', [email], async (err, rows) => {
    if (err) return res.status(500).json({ sucesso: false });

    if (rows.length === 0) {
      return res.json({ sucesso: false, mensagem: 'Email ou senha inválidos' });
    }

    const usuario = rows[0];
    const storedPassword = usuario.password;

    try {
      const passwordMatches = isBcryptHash(storedPassword)
        ? await bcrypt.compare(password, storedPassword)
        : password === storedPassword;

      if (!passwordMatches) {
        return res.json({ sucesso: false, mensagem: 'Email ou senha inválidos' });
      }

      if (!isBcryptHash(storedPassword)) {
        const hashedPassword = await bcrypt.hash(password, passwordSaltRounds);
        con.query(
          'UPDATE usuarios SET password = ? WHERE idusuarios = ?',
          [hashedPassword, usuario.idusuarios],
          (updateErr) => {
            if (updateErr) console.error('Erro ao atualizar hash da senha:', updateErr);
          }
        );
      }

      res.json({ sucesso: true, id: usuario.idusuarios });
    } catch (error) {
      console.error('Erro ao validar senha:', error);
      res.status(500).json({ sucesso: false });
    }
  });
});

app.post('/cadastro', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Informe um email válido.' });
  }

  if (!validateSignupPassword(password)) {
    return res.status(400).json({ sucesso: false, mensagem: `A senha deve ter pelo menos ${minPasswordLength} caracteres.` });
  }

  con.query('SELECT idusuarios FROM usuarios WHERE email = ?', [email], async (err, rows) => {
    if (err) return res.status(500).json({ sucesso: false });

    if (rows.length > 0) {
      return res.json({ sucesso: false, mensagem: 'Email já cadastrado!' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, passwordSaltRounds);

      con.query('INSERT INTO usuarios (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ sucesso: false });
        res.json({ sucesso: true });
      });
    } catch (error) {
      console.error('Erro ao gerar hash da senha:', error);
      res.status(500).json({ sucesso: false });
    }
  });
});

app.get('/', (req, res) => {
  res.redirect('/cadastro.html');
});


app.post('/registrar-compra', (req, res) => {
  const { image_id, usuario_id, link } = req.body;
  con.query(
    'INSERT INTO Image_compradas (image_id, usuario_id, link) VALUES (?, ?, ?)',
    [image_id, usuario_id, link],
    (err) => {
      if (err) return res.status(500).json({ sucesso: false });
      res.json({ sucesso: true });
    }
  );
});

app.get('/minhas-imagens', (req, res) => {
  const { usuario_id } = req.query;
  con.query(
    'SELECT * FROM Image_compradas WHERE usuario_id = ?',
    [usuario_id],
    (err, results) => {
      if (err) return res.status(500).json({ sucesso: false });
      res.json(results);
    }
  );
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
