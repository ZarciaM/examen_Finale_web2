require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const possessionsFilePath = path.join(__dirname, 'routes', 'data.json');

const path = require('path');

// Servir les fichiers statiques React
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Toutes les requêtes non reconnues redirigent vers `index.html`
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});
// Middleware pour gérer les requêtes JSON
app.use(express.json());

// Route pour obtenir la liste des possessions (Read)
app.get('/api/possessions', (req, res) => {
    fs.readFile(possessionsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).send('Error reading possessions data');
        }

        const possessionsData = JSON.parse(data);
        const possessions = possessionsData.find(entry => entry.model === 'Patrimoine')?.data.possessions || [];
        res.json(possessions);
    });
});

// Route pour ajouter une nouvelle possession (Create)
app.post('/api/possessions', (req, res) => {
    const newPossession = req.body;

    if (!newPossession || !newPossession.libelle) {
        return res.status(400).send('Invalid possession data');
    }

    fs.readFile(possessionsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).send('Error reading possessions data');
        }

        const possessionsData = JSON.parse(data);
        const patrimoine = possessionsData.find(entry => entry.model === 'Patrimoine');
        if (patrimoine) {
            patrimoine.data.possessions.push(newPossession);

            fs.writeFile(possessionsFilePath, JSON.stringify(possessionsData, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to data file:', err);
                    return res.status(500).send('Error saving possession');
                }
                res.status(201).json(newPossession);
            });
        } else {
            res.status(500).send('No patrimoine found in data');
        }
    });
});

// Route pour mettre à jour une possession (Update)
app.put('/api/possessions/:libelle', (req, res) => {
    const oldLibelle = decodeURIComponent(req.params.libelle);
    const updatedPossession = req.body;

    if (!updatedPossession || !updatedPossession.libelle) {
        return res.status(400).json({ error: 'Invalid possession data' });
    }

    fs.readFile(possessionsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).json({ error: 'Error reading possessions data' });
        }

        const possessionsData = JSON.parse(data);
        const patrimoine = possessionsData.find(entry => entry.model === 'Patrimoine');

        if (patrimoine) {
            const possessions = patrimoine.data.possessions;
            const index = possessions.findIndex(p => p.libelle === oldLibelle);

            if (index !== -1) {
                possessions[index] = updatedPossession;

                fs.writeFile(possessionsFilePath, JSON.stringify(possessionsData, null, 2), (err) => {
                    if (err) {
                        console.error('Error writing to data file:', err);
                        return res.status(500).json({ error: 'Error updating possession' });
                    }
                    res.json(possessions[index]);
                });
            } else {
                res.status(404).json({ error: 'Possession not found' });
            }
        } else {
            res.status(500).json({ error: 'No patrimoine found in data' });
        }
    });
});

// Route pour clôturer une possession (set la date de fin à aujourd'hui)
app.put('/api/possessions/close/:libelle', (req, res) => {
    const libelle = decodeURIComponent(req.params.libelle);

    fs.readFile(possessionsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).json({ error: 'Error reading possessions data' });
        }

        const possessionsData = JSON.parse(data);
        const patrimoine = possessionsData.find(entry => entry.model === 'Patrimoine');

        if (patrimoine) {
            const possession = patrimoine.data.possessions.find(p => p.libelle === libelle);

            if (possession) {
                possession.dateFin = new Date().toISOString().split('T')[0];

                fs.writeFile(possessionsFilePath, JSON.stringify(possessionsData, null, 2), (err) => {
                    if (err) {
                        console.error('Error writing to data file:', err);
                        return res.status(500).json({ error: 'Error closing possession' });
                    }
                    res.json(possession);
                });
            } else {
                res.status(404).json({ error: 'Possession not found' });
            }
        } else {
            res.status(500).json({ error: 'No patrimoine found in data' });
        }
    });
});

// Route pour supprimer une possession (Delete)
app.delete('/api/possessions/:libelle', (req, res) => {
    const libelle = decodeURIComponent(req.params.libelle);

    fs.readFile(possessionsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).json({ error: 'Error reading possessions data' });
        }

        const possessionsData = JSON.parse(data);
        const patrimoine = possessionsData.find(entry => entry.model === 'Patrimoine');
        if (patrimoine) {
            const initialLength = patrimoine.data.possessions.length;
            patrimoine.data.possessions = patrimoine.data.possessions.filter(p => p.libelle !== libelle);

            if (patrimoine.data.possessions.length < initialLength) {
                fs.writeFile(possessionsFilePath, JSON.stringify(possessionsData, null, 2), (err) => {
                    if (err) {
                        console.error('Error writing to data file:', err);
                        return res.status(500).json({ error: 'Error deleting possession' });
                    }
                    res.status(204).send();
                });
            } else {
                res.status(404).json({ error: 'Possession not found' });
            }
        } else {
            res.status(500).json({ error: 'No patrimoine found in data' });
        }
    });
});

// Démarrer le serveur
app.listen(1234, () => {
    console.log('Server is running on port 1234');
});
