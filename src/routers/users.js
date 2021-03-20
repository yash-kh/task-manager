const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../Middleware/auth')
const { welcomeEmail, deleteEmail } = require('../emails/account')

const router = express.Router()
const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jepg|png)$/)) {
            cb(new Error('Please Provide a Image'))
        }
        cb(undefined, true)
    }
})

// Create user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        welcomeEmail(user.name, user.email)
        const token = await user.generateAuthToken()

        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send({ user, token })
    } catch (e) {
        res.status(400).send('Invalid Credentials');
    }
})

// Get user data
router.get('/users/me', auth, async (req, res) => {
    res.send({ user: req.user, token: req.token })
})

// Upload avatar
router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// Delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

// View avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

// Logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => !(token.token === req.token))
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(401).send()
    }
})

// Logout All sessions
router.post('/users/logoutALL', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Update user
router.patch('/users/me', auth, async (req, res) => {
    const inputs = Object.keys(req.body)
    const validInputs = ['age', 'name', 'email', 'password']
    const valid = inputs.every(input => validInputs.includes(input))

    if (!valid) {
        return res.status(400).send({
            error: "Invalid updates"
        })
    }
    inputs.forEach(input => req.user[input] = req.body[input])

    try {
        await req.user.save({ runValidators: true })
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

//Delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        deleteEmail(req.user.name, req.user.email)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router