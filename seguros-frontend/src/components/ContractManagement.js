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
  Chip,
  ListItemIcon
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, Download as DownloadIcon, Restore as RestoreIcon, Check as CheckIcon, Close as CloseIcon, Add as AddIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon, Info as InfoIcon } from '@mui/icons-material';
import axios from 'axios';
import SignaturePad from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';

// Configuración de la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
  const [userId, setUserId] = useState(null);
  const [selectedInsuranceDetails, setSelectedInsuranceDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener el rol del usuario del token
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.rol);
      setUserId(decodedToken.id);
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

  // Función para procesar los beneficiarios
  const processBeneficiaries = (beneficiarios) => {
    if (!beneficiarios) return [];
    if (Array.isArray(beneficiarios)) return beneficiarios;
    try {
      // Si es un string, intentar parsearlo
      const parsed = JSON.parse(beneficiarios);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error al procesar beneficiarios:', error);
      return [];
    }
  };

  // Función para cargar los detalles del contrato
  const handleOpenDialog = async (contrato) => {
    try {
      setLoading(true);
      setError('');
      setOpenDialog(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/contratos/${contrato.id}/detalles`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const detalles = response.data.data;
        
        // Asegurarse de que los beneficiarios sean un array
        const beneficiarios = Array.isArray(detalles.beneficiarios) 
          ? detalles.beneficiarios 
          : detalles.beneficiarios ? JSON.parse(detalles.beneficiarios) : [];

        // Actualizar el contrato con los detalles
        setSelectedContract({
          ...contrato,
          ...detalles,
          beneficiarios
        });

        setFormData({
          cliente_id: detalles.cliente_id,
          seguro_id: detalles.seguro_id,
          fecha_inicio: detalles.fecha_inicio,
          fecha_fin: detalles.fecha_fin,
          monto_prima: detalles.monto_prima,
          estado: detalles.estado,
          forma_pago: detalles.forma_pago,
          frecuencia_pago: detalles.frecuencia_pago,
          monto_pago: detalles.monto_pago,
          numero_cuenta: detalles.numero_cuenta || '',
          banco: detalles.banco || '',
          tipo_cuenta: detalles.tipo_cuenta || ''
        });

        setBeneficiaries(beneficiarios);
        setMedicalHistory(null);
        setSignature(detalles.firma_cliente || null);
      } else {
        setError('Error al cargar los detalles del contrato');
      }
    } catch (error) {
      console.error('Error al cargar detalles del contrato:', error);
      setError(error.response?.data?.message || 'Error al cargar los detalles del contrato');
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
          `${API_URL}/contratos/${selectedContract.id}/documentos`,
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
          // Actualizar el estado del contrato en la lista
          const updatedContracts = contracts.map(contract => {
            if (contract.id === selectedContract.id) {
              return {
                ...contract,
                estado: response.data.data.estado,
                tiene_historia_medica: response.data.data.tiene_historia_medica,
                tiene_beneficiarios: response.data.data.tiene_beneficiarios,
                tiene_firma: response.data.data.tiene_firma
              };
            }
            return contract;
          });
          setContracts(updatedContracts);
          handleCloseDialog();
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
      console.error('Error al enviar documentos:', error);
      setError(error.response?.data?.message || 'Error al actualizar los documentos');
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

  const handleApproveReject = async (contratoId, accion) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Solo actualizar el estado del contrato
      const response = await axios.put(
        `${API_URL}/contratos/${contratoId}/estado`,
        { estado: accion === 'aprobado' ? 'activo' : 'rechazado' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Actualizar la lista de contratos
        const updatedContratos = contracts.map(contrato => 
          contrato.id === contratoId 
            ? { ...contrato, estado: accion === 'aprobado' ? 'activo' : 'rechazado' }
            : contrato
        );
        setContracts(updatedContratos);
        handleCloseDialog();
        setSuccess(`Contrato ${accion === 'aprobado' ? 'activado' : 'rechazado'} exitosamente`);
      } else {
        setError(response.data.message || 'Error al actualizar el estado del contrato');
      }
    } catch (error) {
      console.error('Error al actualizar estado del contrato:', error);
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
      setLoading(true);
      setError('');
      console.log('Intentando obtener historia médica para contrato:', selectedContract.id);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/contratos/${selectedContract.id}/historia-medica`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf'
        },
        responseType: 'blob'
      });

      console.log('Respuesta recibida:', {
        status: response.status,
        type: response.headers['content-type'],
        size: response.data.size
      });

      // Crear URL del blob y abrir en nueva pestaña
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear un iframe oculto para mostrar el PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Cargar el PDF en el iframe
      iframe.src = url;
      
      // Esperar a que el iframe cargue
      iframe.onload = () => {
        // Abrir el PDF en una nueva ventana
        window.open(url, '_blank');
        // Limpiar
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error al obtener historia médica:', error);
      setError(error.response?.data?.message || 'Error al obtener la historia médica');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHistoriaMedica = async (contratoId) => {
    try {
      setLoading(true);
      console.log('Iniciando descarga de historia médica para contrato:', contratoId);
      
      // Obtener la ruta del archivo del contrato actual
      const contrato = selectedContract;
      if (!contrato || !contrato.historia_medica_path) {
        throw new Error('No hay archivo de historia médica disponible');
      }

      console.log('Ruta del archivo:', contrato.historia_medica_path);
      
      const response = await axios.get(
        `${API_URL}/contratos/${contratoId}/documentos/historia-medica`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        }
      );

      console.log('Archivo recibido, creando blob...');
      
      // Crear un blob con la respuesta
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear un enlace temporal y hacer clic en él
      const link = document.createElement('a');
      link.href = url;
      link.download = contrato.historia_medica_path.split('/').pop() || `historia-medica-${contratoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Descarga completada exitosamente');
    } catch (error) {
      console.error('Error al descargar historia médica:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      setError('Error al descargar la historia médica: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const canApproveContract = (contrato) => {
    // Verificación básica de estado y rol
    if (contrato.estado !== 'pendiente_revision' || userRole !== 'agente') {
      return false;
    }

    // Verificación simple de documentos requeridos
    return Boolean(
      contrato.historia_medica_path && 
      contrato.firma_cliente && 
      contrato.beneficiarios?.length > 0
    );
  };

  const handleInsuranceChange = async (e) => {
    const seguroId = e.target.value;
    setFormData(prev => ({ ...prev, seguro_id: seguroId }));
    
    if (seguroId) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/seguros/${seguroId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (response.data.success) {
          setSelectedInsuranceDetails(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar detalles del seguro:', error);
      }
    } else {
      setSelectedInsuranceDetails(null);
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
          <Grid container spacing={3} sx={{ mt: 1 }}>
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
                      onChange={handleInsuranceChange}
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
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Historia Médica
                        </Typography>
                        {selectedContract.historia_medica_path ? (
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Archivo subido: {selectedContract.historia_medica_path.split('/').pop()}
                            </Typography>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleDownloadHistoriaMedica(selectedContract.id)}
                              startIcon={<DownloadIcon />}
                              sx={{ mt: 1 }}
                            >
                              Descargar Historia Médica
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No se ha subido historia médica
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    {/* Beneficiarios */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Beneficiarios
                      </Typography>
                      {processBeneficiaries(selectedContract.beneficiarios).map((beneficiario, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                          <Typography><strong>Nombre:</strong> {beneficiario.nombre}</Typography>
                          <Typography><strong>Parentesco:</strong> {beneficiario.parentesco}</Typography>
                          <Typography><strong>Fecha de Nacimiento:</strong> {beneficiario.fecha_nacimiento}</Typography>
                        </Box>
                      ))}
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

                {/* Detalles del Seguro */}
                {selectedInsuranceDetails && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Detalles del Seguro
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            <strong>Tipo:</strong> {selectedInsuranceDetails.tipo === 'medico' ? 'Médico' : 'Vida'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            <strong>Cobertura:</strong>{' '}
                            {selectedInsuranceDetails.tipo === 'medico' 
                              ? `${selectedInsuranceDetails.cobertura}% de gastos médicos`
                              : `$${selectedInsuranceDetails.cobertura} en caso de fallecimiento`}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            <strong>Beneficios:</strong>
                          </Typography>
                          <List>
                            {selectedInsuranceDetails.beneficios.split(',').map((beneficio, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <CheckCircleIcon color="success" />
                                </ListItemIcon>
                                <ListItemText primary={beneficio.trim()} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            <strong>Requisitos:</strong>
                          </Typography>
                          <List>
                            {selectedInsuranceDetails.requisitos.split(',').map((requisito, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <InfoIcon color="info" />
                                </ListItemIcon>
                                <ListItemText primary={requisito.trim()} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
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
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Historia Médica
                    </Typography>
                    {selectedContract ? (
                      <>
                        {userRole === 'cliente' && (
                          <>
                            {!selectedContract.tiene_historia_medica ? (
                              <Box sx={{ mt: 2 }}>
                                <input
                                  accept=".pdf"
                                  style={{ display: 'none' }}
                                  id="historia-medica-upload"
                                  type="file"
                                  onChange={handleMedicalHistoryUpload}
                                />
                                <label htmlFor="historia-medica-upload">
                                  <Button
                                    variant="contained"
                                    component="span"
                                    startIcon={<AddIcon />}
                                    disabled={loading}
                                  >
                                    Subir Historia Médica
                                  </Button>
                                </label>
                                {medicalHistory && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    Archivo seleccionado: {medicalHistory.name}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body1" color="success.main">
                                  Historia médica subida correctamente
                                </Typography>
                                <Button
                                  variant="outlined"
                                  onClick={handleViewMedicalHistory}
                                  startIcon={<VisibilityIcon />}
                                  sx={{ mt: 1 }}
                                >
                                  Ver Historia Médica
                                </Button>
                              </Box>
                            )}
                          </>
                        )}
                        {userRole === 'agente' && selectedContract.tiene_historia_medica && (
                          <Button
                            variant="outlined"
                            onClick={handleViewMedicalHistory}
                            startIcon={<VisibilityIcon />}
                            sx={{ mt: 1 }}
                          >
                            Ver Historia Médica
                          </Button>
                        )}
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        Seleccione un contrato para ver sus detalles
                      </Typography>
                    )}
                  </Paper>
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

                {/* Botón de Rechazar para Agentes */}
                {userRole === 'agente' && selectedContract?.estado === 'pendiente_revision' && (
                  <Grid item xs={12} sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleApproveReject(selectedContract.id, 'rechazado')}
                      disabled={loading}
                    >
                      Rechazar Contrato
                    </Button>
                  </Grid>
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