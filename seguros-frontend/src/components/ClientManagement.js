import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        estado: 'activo',
        nombre_usuario: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/users/clientes`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.data.success) {
                setClients(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            setError('Error al cargar los clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (client = null) => {
        if (client) {
            setSelectedClient(client);
            setFormData({
                nombre: client.nombre,
                apellido: client.apellido,
                email: client.email,
                telefono: client.telefono,
                direccion: client.direccion || '',
                estado: client.estado,
                nombre_usuario: client.nombre_usuario
            });
        } else {
            setSelectedClient(null);
            setFormData({
                nombre: '',
                apellido: '',
                email: '',
                telefono: '',
                direccion: '',
                estado: 'activo',
                nombre_usuario: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedClient(null);
        setFormData({
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            direccion: '',
            estado: 'activo',
            nombre_usuario: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            // Validar campos requeridos
            if (!formData.nombre || !formData.apellido || !formData.email || !formData.telefono || !formData.nombre_usuario) {
                setError('Los campos nombre, apellido, email, teléfono y nombre de usuario son requeridos');
                setLoading(false);
                return;
            }

            const data = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.email,
                telefono: formData.telefono,
                direccion: formData.direccion || '',
                estado: formData.estado,
                nombre_usuario: formData.nombre_usuario
            };

            const response = await axios({
                method: selectedClient ? 'put' : 'post',
                url: `${API_URL}/users/clientes${selectedClient ? `/${selectedClient.id}` : ''}`,
                data,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuccessMessage(`Cliente ${selectedClient ? 'actualizado' : 'creado'} exitosamente`);
                handleCloseDialog();
                fetchClients();
            }
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            setError(error.response?.data?.message || 'Error al guardar el cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await axios.delete(
                    `${API_URL}/users/clientes/${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    setSuccessMessage('Cliente eliminado exitosamente');
                    fetchClients();
                }
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
                setError('Error al eliminar el cliente');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Gestión de Clientes
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Cliente
                </Button>
            </Box>

            {/* Tabla de Clientes */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Apellido</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No hay clientes registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>{client.nombre}</TableCell>
                                        <TableCell>{client.apellido}</TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>{client.telefono}</TableCell>
                                        <TableCell>
                                            <Alert 
                                                severity={client.estado === 'activo' ? 'success' : 'error'}
                                                sx={{ py: 0 }}
                                            >
                                                {client.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                            </Alert>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(client)}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(client.id)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Diálogo de Formulario */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Apellido"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre de Usuario"
                                name="nombre_usuario"
                                value={formData.nombre_usuario}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Dirección"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Estado"
                                name="estado"
                                select
                                value={formData.estado}
                                onChange={handleInputChange}
                                required
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : selectedClient ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error || !!successMessage}
                autoHideDuration={6000}
                onClose={() => {
                    setError('');
                    setSuccessMessage('');
                }}
            >
                <Alert
                    onClose={() => {
                        setError('');
                        setSuccessMessage('');
                    }}
                    severity={error ? 'error' : 'success'}
                    sx={{ width: '100%' }}
                >
                    {error || successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ClientManagement; 