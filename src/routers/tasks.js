const express = require('express');
const Task = require('../models/task');
const auth = require('../Middleware/auth')

const router = express.Router()

// Create task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Read all tasks
router.get('/tasks', auth, async (req, res) => {
    let sort = {}
    let match = {}

    if (req.query.compleated) { match.compleated = req.query.compleated === 'true' }

    if (req.query.sort) {
        temp = req.query.sort.split(':')
        sort = {}
        sort[temp[0]] = temp[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }
})

// Read task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send({ error: 'Invalid ID' })
        }
        res.send(task)
    } catch (e) {
        if (e.stringValue) {
            return res.status(404).send({ error: 'Invalid ID' })
        }
        res.status(500).send(e)
    }
})

// Update task
router.patch('/tasks/:id', auth, async (req, res) => {
    const inputs = Object.keys(req.body)
    const validInputs = ['compleated', 'description']
    const valid = inputs.every((input) => validInputs.includes(input));
    if (!valid) {
        return res.send({
            error: "Invalid updates!"
        })
    }

    try {
        const _id = req.params.id
        const task = await Task.findOneAndUpdate({ _id, owner: req.user._id }, req.body, { new: true, runValidators: true })
        if (!task) {
            return res.status(404).send({ error: 'Invalid ID' })
        }
        res.send(task)
    } catch (e) {
        if (e.stringValue) {
            return res.status(404).send({ error: 'Invalid ID' })
        }
        res.status(500).send(e)
    }
})

// Delete task
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send({ error: 'Invalid ID' })
        }
        res.send(task)
    } catch (e) {
        if (e.stringValue) {
            return res.status(404).send({ error: 'Invalid ID' })
        }
        res.status(500).send(e)
    }
})

module.exports = router;