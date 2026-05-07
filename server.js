import express from "express";
import mysql from "mysql";

const port = process.env.PORT || 3030;

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
  const { email, password } = req.body;
  con.query('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, password], (err, rows) => {
    if (err) return res.status(500).json({ sucesso: false });
    if (rows.length > 0) {
      res.json({ sucesso: true, id: rows[0].idusuarios });
    } else {
      res.json({ sucesso: false, mensagem: 'Email ou senha inválidos' });
    }
  });
});

app.post('/cadastro', (req, res) => {
  const { email, password } = req.body;

  con.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ sucesso: false });

    if (rows.length > 0) {
      return res.json({ sucesso: false, mensagem: 'Email já cadastrado!' });
    }

    con.query('INSERT INTO usuarios (email, password) VALUES (?, ?)', [email, password], (err) => {
      if (err) return res.status(500).json({ sucesso: false });
      res.json({ sucesso: true });
    });
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
