import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Container,
  CircularProgress,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, Download as DownloadIcon, Restore as RestoreIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import SignaturePad from 'react-signature-canvas';

const ContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signaturePad, setSignaturePad] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    cliente_id: '',
    seguro_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    monto_prima: '',
    estado: 'pendiente',
    forma_pago: 'efectivo',
    frecuencia_pago: 'mensual',
    monto_pago: '',
    banco: '',
    numero_cuenta: '',
    tipo_cuenta: ''
  });
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    // Obtener el rol del usuario del token
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.rol);
    }
    console.log('Iniciando carga de datos...');
    fetchContracts();
    fetchClients();
    fetchInsurances();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const userId = decodedToken.id;
      const userRole = decodedToken.rol;

      let url = '/api/contratos';
      if (userRole === 'cliente') {
        url = '/api/contratos/mis-contratos';
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Respuesta del servidor:', response.data);
      if (response.data.success) {
        setContracts(response.data.data);
      } else {
        setError('Error al cargar los contratos: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      setError('Error al cargar los contratos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Cambiado a la URL correcta para clientes
      const response = await axios.get('/api/users/clientes', { headers });
      console.log('Respuesta completa de clientes:', response);
      console.log('Datos de clientes:', response.data);

      // Verificar la estructura de la respuesta
      if (response.data) {
        let clientsData;
        if (response.data.success && response.data.data) {
          clientsData = response.data.data;
        } else if (response.data.data) {
          clientsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          clientsData = response.data;
        } else {
          clientsData = [];
        }

        // Verificar que clientsData sea un array
        if (!Array.isArray(clientsData)) {
          console.error('Los datos de clientes no son un array:', clientsData);
          clientsData = [];
        }

        console.log('Clientes a guardar:', clientsData);
        setClients(clientsData);
      } else {
        console.error('Respuesta sin datos:', response);
        setError('Error al cargar los clientes: No hay datos disponibles');
        setClients([]);
      }
    } catch (error) {
      console.error('Error completo al cargar clientes:', error);
      console.error('Detalles del error:', error.response?.data);
      setError(error.response?.data?.message || 'Error al cargar los clientes');
      setClients([]);
    }
  };

  const fetchInsurances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/seguros', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsurances(response.data);
    } catch (error) {
      setError('Error al cargar los seguros');
    }
  };

  const handleOpenDialog = async (contract = null) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Cargar clientes si no están cargados y es agente
      if (userRole === 'agente' && clients.length === 0) {
        console.log('Cargando clientes antes de abrir diálogo...');
        await fetchClients();
      }

      if (contract) {
        const response = await axios.get(`/api/contratos/${contract.id}/detalles`, { headers });
        console.log('Respuesta del servidor:', response.data);

        if (response.data && response.data.success) {
          const contractData = response.data.data;
          setSelectedContract(contractData);
          setFormData({
            cliente_id: contractData.cliente_id,
            seguro_id: contractData.seguro_id,
            fecha_inicio: contractData.fecha_inicio,
            fecha_fin: contractData.fecha_fin,
            monto_prima: contractData.monto_prima,
            estado: contractData.estado,
            forma_pago: contractData.forma_pago || 'efectivo',
            frecuencia_pago: contractData.frecuencia_pago || 'mensual',
            monto_pago: contractData.monto_pago || '',
            banco: contractData.banco || '',
            numero_cuenta: contractData.numero_cuenta || '',
            tipo_cuenta: contractData.tipo_cuenta || ''
          });

          // Cargar beneficiarios si existen
          if (contractData.beneficiarios) {
            setBeneficiaries(contractData.beneficiarios);
          } else {
            setBeneficiaries([]);
          }
        } else {
          throw new Error('No se pudieron obtener los datos del contrato');
        }
      } else {
        // Resetear el formulario para nuevo contrato
        setSelectedContract(null);
        setFormData({
          cliente_id: '',
          seguro_id: '',
          fecha_inicio: '',
          fecha_fin: '',
          monto_prima: '',
          estado: 'pendiente',
          forma_pago: 'efectivo',
          frecuencia_pago: 'mensual',
          monto_pago: '',
          banco: '',
          numero_cuenta: '',
          tipo_cuenta: ''
        });
        setBeneficiaries([]);
      }
      setMedicalHistory(null);
      setSignature('');
      setOpenDialog(true);
    } catch (error) {
      console.error('Error al cargar contrato:', error);
      setError(error.response?.data?.message || error.message || 'Error al cargar los detalles del contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContract(null);
    setFormData({
      cliente_id: '',
      seguro_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      monto_prima: '',
      estado: 'pendiente',
      forma_pago: 'efectivo',
      frecuencia_pago: 'mensual',
      monto_pago: '',
      banco: '',
      numero_cuenta: '',
      tipo_cuenta: ''
    });
    setMedicalHistory(null);
    setBeneficiaries([]);
    setSignature(null);
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Campo ${name} cambiado a:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignatureEnd = () => {
    if (signaturePad) {
      setSignature(signaturePad.toDataURL());
    }
  };

  const handleMedicalHistoryUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedicalHistory(file);
      setFormData(prev => ({
        ...prev,
        historia_medica: file
      }));
    }
  };

  const handleAddBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { nombre: '', parentesco: '', fecha_nacimiento: '' }]);
  };

  const handleBeneficiaryChange = (index, field, value) => {
    const newBeneficiaries = [...beneficiaries];
    newBeneficiaries[index] = {
      ...newBeneficiaries[index],
      [field]: value
    };
    setBeneficiaries(newBeneficiaries);
    setFormData(prev => ({
      ...prev,
      beneficiarios: newBeneficiaries
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (userRole === 'cliente') {
        // Si es cliente, solo actualizar documentos
        const formData = new FormData();
        
        // Validar y agregar historia médica
        if (medicalHistory) {
          // Verificar que sea un PDF
          if (medicalHistory.type !== 'application/pdf') {
            setError('La historia médica debe ser un archivo PDF');
            setLoading(false);
            return;
          }
          formData.append('historia_medica', medicalHistory);
        }
        
        // Agregar beneficiarios
        if (beneficiaries.length > 0) {
          formData.append('beneficiarios', JSON.stringify(beneficiaries));
        }
        
        // Agregar firma
        if (signature) {
          formData.append('firma_cliente', signature);
        }

        // Verificar que al menos un documento se está enviando
        if (!medicalHistory && beneficiaries.length === 0 && !signature) {
          setError('Debe proporcionar al menos un documento');
          setLoading(false);
          return;
        }

        console.log('Enviando documentos:', {
          historia_medica: medicalHistory ? 'presente' : 'ausente',
          beneficiarios: beneficiaries.length,
          firma_cliente: signature ? 'presente' : 'ausente'
        });

        // Enviar los datos
        const response = await axios.put(
          `/api/contratos/${selectedContract.id}/documentos`,
          formData,
          {
            headers: {
              ...headers,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          setSuccess('Documentos actualizados correctamente');
          handleCloseDialog();
          fetchContracts();
        } else {
          setError('Error al actualizar documentos: ' + response.data.message);
        }
      } else {
        // Lógica para agentes
        if (!formData.cliente_id || !formData.seguro_id || !formData.fecha_inicio || 
            !formData.fecha_fin || !formData.monto_prima || !formData.forma_pago || 
            !formData.frecuencia_pago || !formData.monto_pago) {
          setError('Los campos cliente, seguro, fechas, monto, forma de pago, frecuencia y monto de pago son requeridos');
          setLoading(false);
          return;
        }

        if (formData.forma_pago === 'transferencia' && 
            (!formData.numero_cuenta || !formData.banco || !formData.tipo_cuenta)) {
          setError('Por favor complete los datos bancarios');
          setLoading(false);
          return;
        }

        const data = {
          cliente_id: formData.cliente_id,
          seguro_id: formData.seguro_id,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          monto_prima: parseFloat(formData.monto_prima),
          estado: formData.estado,
          forma_pago: formData.forma_pago,
          frecuencia_pago: formData.frecuencia_pago,
          monto_pago: parseFloat(formData.monto_pago),
          numero_cuenta: formData.numero_cuenta || null,
          banco: formData.banco || null,
          tipo_cuenta: formData.tipo_cuenta || null,
          beneficiarios: beneficiaries
        };

        let response;
        if (selectedContract) {
          response = await axios.put(`/api/contratos/${selectedContract.id}`, data, { headers });
        } else {
          response = await axios.post('/api/contratos', data, { headers });
        }

        if (response.data.success) {
          setSuccess(selectedContract ? 'Contrato actualizado correctamente' : 'Contrato creado correctamente');
          handleCloseDialog();
          fetchContracts();
        } else {
          setError('Error al procesar la solicitud: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contratoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await axios.delete(`/api/contratos/${contratoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchContracts();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      setError(error.response?.data?.message || 'Error al eliminar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (contratoId, estado, comentario = '') => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Convertir el estado al formato que espera el backend
      const estadoBackend = estado === 'aprobado' ? 'activo' : 'pendiente';

      const response = await axios.put(
        `/api/contratos/${contratoId}/estado`,
        { estado: estadoBackend, comentario },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        handleCloseDialog();
        fetchContracts();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError(error.response?.data?.message || 'Error al actualizar el estado del contrato');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la subida de la historia médica
  const handleMedicalHistoryChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar que sea un PDF
      if (file.type !== 'application/pdf') {
        setError('Por favor, seleccione un archivo PDF');
        e.target.value = null;
        return;
      }
      setMedicalHistory(file);
      setError(''); // Limpiar error si el archivo es válido
    }
  };

  // Función para ver la historia médica
  const handleViewMedicalHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/contratos/${selectedContract.id}/historia-medica`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Crear URL del blob y abrir en nueva pestaña
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al obtener historia médica:', error);
      setError('Error al obtener la historia médica');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {userRole === 'agente' ? 'Gestión de Contratos' : 'Mis Contratos'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {userRole === 'agente' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
              sx={{ mb: 2 }}
            >
              Crear Nuevo Contrato
            </Button>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Seguro</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Monto Prima</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.length > 0 ? (
                  contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.id}</TableCell>
                      <TableCell>{contract.cliente?.nombre || contract.nombre_cliente || 'N/A'}</TableCell>
                      <TableCell>{contract.seguro?.nombre || contract.nombre_seguro || 'N/A'}</TableCell>
                      <TableCell>{new Date(contract.fecha_inicio).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(contract.fecha_fin).toLocaleDateString()}</TableCell>
                      <TableCell>${contract.monto_prima}</TableCell>
                      <TableCell>
                        <Chip
                          label={contract.estado}
                          color={
                            contract.estado === 'activo' ? 'success' :
                            contract.estado === 'pendiente' ? 'warning' :
                            contract.estado === 'rechazado' ? 'error' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {userRole === 'agente' ? (
                          <>
                            <IconButton onClick={() => handleOpenDialog(contract)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(contract.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenDialog(contract)}
                          >
                            Completar Documentos
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay contratos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {userRole === 'agente' 
            ? (selectedContract ? 'Editar Contrato' : 'Nuevo Contrato')
            : 'Completar Documentos del Contrato'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {userRole === 'agente' ? (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Cliente</InputLabel>
                    <Select
                      name="cliente_id"
                      value={formData.cliente_id}
                      onChange={handleInputChange}
                      required
                      disabled={!!selectedContract}
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.nombre} {client.apellido}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Seguro</InputLabel>
                    <Select
                      name="seguro_id"
                      value={formData.seguro_id}
                      onChange={handleInputChange}
                      required
                      disabled={!!selectedContract}
                    >
                      {insurances.map((insurance) => (
                        <MenuItem key={insurance.id} value={insurance.id}>
                          {insurance.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    name="fecha_inicio"
                    label="Fecha de Inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={!!selectedContract}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    name="fecha_fin"
                    label="Fecha de Fin"
                    value={formData.fecha_fin}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={!!selectedContract}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    name="monto_prima"
                    label="Monto de Prima"
                    value={formData.monto_prima}
                    onChange={handleInputChange}
                    required
                    disabled={!!selectedContract}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="activo">Activo</MenuItem>
                      <MenuItem value="inactivo">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Configuración de Pago
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      name="forma_pago"
                      value={formData.forma_pago}
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="efectivo">Efectivo</MenuItem>
                      <MenuItem value="transferencia">Transferencia Bancaria</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia de Pago</InputLabel>
                    <Select
                      name="frecuencia_pago"
                      value={formData.frecuencia_pago}
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="mensual">Mensual</MenuItem>
                      <MenuItem value="trimestral">Trimestral</MenuItem>
                      <MenuItem value="semestral">Semestral</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    name="monto_pago"
                    label="Monto por Pago"
                    value={formData.monto_pago}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                {formData.forma_pago === 'transferencia' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="banco"
                        label="Banco"
                        value={formData.banco}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="numero_cuenta"
                        label="Número de Cuenta"
                        value={formData.numero_cuenta}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Cuenta</InputLabel>
                        <Select
                          name="tipo_cuenta"
                          value={formData.tipo_cuenta}
                          onChange={handleInputChange}
                          required
                        >
                          <MenuItem value="ahorro">Ahorro</MenuItem>
                          <MenuItem value="corriente">Corriente</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

                {/* Sección de Documentos del Cliente (solo visible cuando se está editando un contrato) */}
                {selectedContract && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Documentos del Cliente
                      </Typography>
                    </Grid>

                    {/* Historia Médica */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Historia Médica
                      </Typography>
                      {selectedContract.historia_medica ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Alert severity="success" sx={{ flex: 1 }}>
                            Historia médica subida correctamente
                          </Alert>
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => window.open(selectedContract.historia_medica, '_blank')}
                          >
                            Ver Documento
                          </Button>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          Historia médica pendiente
                        </Alert>
                      )}
                    </Grid>

                    {/* Beneficiarios */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Beneficiarios
                      </Typography>
                      {selectedContract.beneficiarios?.length > 0 ? (
                        <List>
                          {selectedContract.beneficiarios.map((beneficiary, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={beneficiary.nombre}
                                secondary={`Parentesco: ${beneficiary.parentesco} - Fecha de Nacimiento: ${new Date(beneficiary.fecha_nacimiento).toLocaleDateString()}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="warning">
                          No se han registrado beneficiarios
                        </Alert>
                      )}
                    </Grid>

                    {/* Firma */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Firma del Cliente
                      </Typography>
                      {selectedContract.firma_cliente ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Alert severity="success">
                            Contrato firmado correctamente
                          </Alert>
                          <Box
                            component="img"
                            src={selectedContract.firma_cliente}
                            alt="Firma del cliente"
                            sx={{
                              maxWidth: '100%',
                              height: 'auto',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              backgroundColor: '#fff'
                            }}
                          />
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          Firma pendiente
                        </Alert>
                      )}
                    </Grid>

                    {/* Acciones de Aprobación */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Acciones
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleApproveReject(selectedContract.id, 'aprobado')}
                          disabled={!selectedContract.historia_medica || !selectedContract.firma_cliente}
                          startIcon={<CheckIcon />}
                        >
                          Aprobar Contrato
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleApproveReject(selectedContract.id, 'rechazado')}
                          startIcon={<CloseIcon />}
                        >
                          Rechazar Contrato
                        </Button>
                      </Box>
                    </Grid>
                  </>
                )}
              </>
            ) : (
              // Vista para clientes
              <>
                {/* Información del contrato */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Información del Contrato
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cliente"
                    value={selectedContract?.nombre_cliente || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Seguro"
                    value={selectedContract?.nombre_seguro || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Inicio"
                    value={selectedContract?.fecha_inicio ? new Date(selectedContract.fecha_inicio).toLocaleDateString() : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Fin"
                    value={selectedContract?.fecha_fin ? new Date(selectedContract.fecha_fin).toLocaleDateString() : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Monto de Prima"
                    value={`$${selectedContract?.monto_prima || ''}`}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={selectedContract?.estado || ''}
                    disabled
                  />
                </Grid>

                {/* Información de Pago */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Información de Pago
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Método de Pago"
                    value={selectedContract?.forma_pago || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Frecuencia de Pago"
                    value={selectedContract?.frecuencia_pago || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Monto por Pago"
                    value={`$${selectedContract?.monto_pago || ''}`}
                    disabled
                  />
                </Grid>

                {/* Documentos Requeridos */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Documentos Requeridos
                  </Typography>
                </Grid>

                {/* Historia Médica */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Historia Médica
                  </Typography>
                  {selectedContract?.historia_medica ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Historia médica subida correctamente
                    </Alert>
                  ) : (
                    <>
                      <input
                        accept=".pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        id="medical-history-upload"
                        type="file"
                        onChange={handleMedicalHistoryChange}
                      />
                      <label htmlFor="medical-history-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadIcon />}
                        >
                          Subir Historia Médica
                        </Button>
                      </label>
                      {medicalHistory && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Archivo seleccionado: {medicalHistory.name}
                        </Typography>
                      )}
                    </>
                  )}
                </Grid>

                {/* Beneficiarios */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Beneficiarios
                  </Typography>
                  {selectedContract?.beneficiarios?.length > 0 ? (
                    <List>
                      {selectedContract.beneficiarios.map((beneficiary, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={beneficiary.nombre}
                            secondary={`Parentesco: ${beneficiary.parentesco} - Fecha de Nacimiento: ${new Date(beneficiary.fecha_nacimiento).toLocaleDateString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        onClick={handleAddBeneficiary}
                        sx={{ mb: 2 }}
                      >
                        Agregar Beneficiario
                      </Button>
                      <List>
                        {beneficiaries.map((beneficiary, index) => (
                          <ListItem key={index}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  fullWidth
                                  label="Nombre"
                                  value={beneficiary.nombre}
                                  onChange={(e) => handleBeneficiaryChange(index, 'nombre', e.target.value)}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  fullWidth
                                  label="Parentesco"
                                  value={beneficiary.parentesco}
                                  onChange={(e) => handleBeneficiaryChange(index, 'parentesco', e.target.value)}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  fullWidth
                                  type="date"
                                  label="Fecha de Nacimiento"
                                  value={beneficiary.fecha_nacimiento}
                                  onChange={(e) => handleBeneficiaryChange(index, 'fecha_nacimiento', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                />
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Grid>

                {/* Firma */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Firma del Cliente
                  </Typography>
                  {selectedContract?.firma_cliente ? (
                    <Alert severity="success">
                      Contrato firmado correctamente
                    </Alert>
                  ) : (
                    <>
                      <Paper
                        variant="outlined"
                        sx={{
                          width: '100%',
                          height: '400px',
                          mb: 2,
                          position: 'relative',
                          backgroundColor: '#fff',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                          }}
                        >
                          <SignaturePad
                            ref={(ref) => setSignaturePad(ref)}
                            canvasProps={{
                              className: 'signature-canvas',
                              style: {
                                width: '100%',
                                height: '100%',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                              }
                            }}
                            onEnd={handleSignatureEnd}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              color: 'text.secondary',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              zIndex: 1
                            }}
                          >
                            Firma aquí
                          </Typography>
                        </Box>
                      </Paper>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => signaturePad?.clear()}
                          startIcon={<DeleteIcon />}
                        >
                          Limpiar Firma
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            if (signaturePad) {
                              signaturePad.fromDataURL(signature);
                            }
                          }}
                          startIcon={<RestoreIcon />}
                          disabled={!signature}
                        >
                          Restaurar Firma
                        </Button>
                      </Box>
                      {signature && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          Firma capturada correctamente
                        </Alert>
                      )}
                    </>
                  )}
                </Grid>

                {/* Botón para ver historia médica */}
                {selectedContract?.historia_medica && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleViewMedicalHistory}
                    className="mt-4"
                  >
                    Ver Historia Médica
                  </Button>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContractManagement; 