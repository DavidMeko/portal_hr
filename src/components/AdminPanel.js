import React, { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const result = await window.electron.auth.getUsers();
        if (result.success) {
            setUsers(result.users);
        } else {
            console.error('Failed to fetch users:', result.error);
        }
    };

    const handleOpenDialog = (user = null) => {
        setEditingUser(user);
        if (user) {
            setUsername(user.username);
            setRole(user.role);
        } else {
            setUsername('');
            setPassword('');
            setRole('user');
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
    };

    const handleSubmit = async () => {
        if (editingUser) {
            const result = await window.electron.auth.updateUser({ id: editingUser.id, username, role });
            if (result.success) {
                fetchUsers();
            } else {
                console.error('Failed to update user:', result.error);
            }
        } else {
            const result = await window.electron.auth.createUser({ username, password, role });
            if (result.success) {
                fetchUsers();
            } else {
                console.error('Failed to create user:', result.error);
            }
        }
        handleCloseDialog();
    };

    const handleDeleteUser = async (id) => {
        const result = await window.electron.auth.deleteUser(id);
        if (result.success) {
            fetchUsers();
        } else {
            console.error('Failed to delete user:', result.error);
        }
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h5" gutterBottom>Admin Panel</Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
                Add New User
            </Button>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleOpenDialog(user)}>Edit</Button>
                                    <Button onClick={() => handleDeleteUser(user.id)} color="secondary">Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        type="text"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {!editingUser && (
                        <TextField
                            margin="dense"
                            label="Password"
                            type="password"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    )}
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} color="primary">
                        {editingUser ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default AdminPanel;