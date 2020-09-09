const fastify = require('fastify')
const oas = require('fastify-oas')
const path = require('path')

const fsp = require('fs').promises;

const app = fastify();

const dataPath = path.resolve(__dirname, 'data');
const usersJsonPath = path.resolve(dataPath, 'users.json')

app.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/',
})

app.addHook('onRequest', (req, reply, next) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range');
    reply.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range');
    if (req.method === 'OPTIONS') {
        reply.send('');
    } else {
        next();
    }
});

app.register(oas, {
    routePrefix: '/documentation',
    exposeRoute: true,
    swagger: {
        info: {
            title: 'Test openapi',
            description: 'testing the fastify swagger api',
            version: '0.1.0',
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here',
        },
        host: '127.0.0.1:9000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    },
    exposeRoute: true
});

app.route({
    method: 'POST',
    url: '/user/sign-up',
    schema: {
        body: {
            type: 'object',
            description: 'user sign up',
            properties: {
                username: {
                    type: 'string',
                    pattern: '[a-z][a-z0-9]{3,23}'
                },
                password: {
                    type: 'string',
                    pattern: '[a-z0-9]{6,}'
                },
                nationalID: {
                    type: 'string',
                    pattern: '[0-9]{10}'
                },
                active: {
                    type: 'boolean'
                },
                mobilePhone: {
                    type: 'string',
                    pattern: '09[0-9]{9}'
                },
            }
        }
    },
    handler: async (req, reply) => {
        let users = [];
        try {
            let d = JSON.parse((await fsp.readFile(usersJsonPath, { encoding: 'utf8' })));
            users = d;
        } catch (e) {}

        users.push({
            username: req.body.username,
            password: req.body.password,
            nationalID: req.body.nationalID,
            mobilePhone: req.body.mobilePhone,
            active: req.body.active,
        });

        await fsp.writeFile(usersJsonPath, JSON.stringify(users));
        return true;
    },
});

app.route({
    method: 'POST',
    url: '/user/sign-in',
    schema: {
        body: {
            type: 'object',
            description: 'user sign in',
            properties: {
                username: {
                    type: 'string',
                    pattern: '[a-z][a-z0-9]{3,23}'
                },
                password: {
                    type: 'string',
                    pattern: '[a-z0-9]{6,}'
                },
            }
        }
    },
    handler: async (req, reply) => {
        let users = [];
        try {
            let d = JSON.parse((await fsp.readFile(usersJsonPath, { encoding: 'utf8' })));
            users = d;
        } catch (e) {}

        const u = users.filter((f) => {
            if (f.username === req.body.username && f.password === req.body.password) {
                return true;
            }
            return false;
        });

        if (u.length >= 1) {
            return true;
        }

        return false;
    },
});

app.route({
    method: 'GET',
    url: '/user/list',
    schema: {
    },
    handler: async (req, reply) => {
        let users = [];
        try {
            let d = JSON.parse((await fsp.readFile(usersJsonPath, { encoding: 'utf8' })));
            users = d;
        } catch (e) {}

        return users;
    },
});

app.listen(9000, '0.0.0.0');
