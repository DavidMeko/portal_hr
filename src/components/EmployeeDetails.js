import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
    Grid, Paper, Tabs, Tab, CircularProgress, Avatar, Card, CardContent, 
    Box, Divider, IconButton, TextField, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isSameDay } from 'date-fns';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    overflow: 'hidden',
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(15),
  height: theme.spacing(15),
  margin: '0 auto',
  marginBottom: theme.spacing(2),
}));

const CompareButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
}));

const InfoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '& .MuiCardContent-root': {
    flexGrow: 1,
    padding: theme.spacing(1),
  },
}));

const ValueTypography = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
}));

const PermissionCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(2),
}));

const SystemCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
}));

const EmployeeDetails = ({ open, onClose, employee, system }) => {
    const [tabValue, setTabValue] = useState(0);
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [comparisonData, setComparisonData] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [newPermission, setNewPermission] = useState('');
    const [editingPermission, setEditingPermission] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [sapTransactions, setSapTransactions] = useState([]);
    const [newTransaction, setNewTransaction] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editTransactionDialogOpen, setEditTransactionDialogOpen] = useState(false);

    useEffect(() => {
        if (system === 'hilan' && employee?.hilan_employee_id) {
            fetchAttendanceData();
            fetchPermissions();
        } else if (system === 'sap' && employee?.sap_employee_id) {
            fetchSAPTransactions();
        }
    }, [employee, system]);

    const fetchSAPTransactions = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('get-transactions', employee.sap_employee_id);
            if (result.success) {
                setSapTransactions(result.transactions);
            } else {
                console.error('Failed to fetch SAP transactions:', result.error);
                showSnackbar('Failed to fetch SAP transactions', 'error');
            }
        } catch (error) {
            console.error('Error fetching SAP transactions:', error);
            showSnackbar('Error fetching SAP transactions', 'error');
        }
    };

    const handleAddTransaction = async () => {
        if (!newTransaction) return;
        try {
            const result = await window.electron.ipcRenderer.invoke('add-transaction', {
                employeeId: employee.sap_employee_id,
                transactionCode: newTransaction,
            });
            if (result.success) {
                setNewTransaction('');
                fetchSAPTransactions();
                showSnackbar('Transaction added successfully', 'success');
            } else {
                console.error('Failed to add transaction:', result.error);
                showSnackbar('Failed to add transaction', 'error');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            showSnackbar('Error adding transaction', 'error');
        }
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
        setEditTransactionDialogOpen(true);
    };

    const handleSaveTransaction = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('update-transaction', editingTransaction);
            if (result.success) {
                fetchSAPTransactions();
                setEditTransactionDialogOpen(false);
                showSnackbar('Transaction updated successfully', 'success');
            } else {
                console.error('Failed to update transaction:', result.error);
                showSnackbar('Failed to update transaction', 'error');
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            showSnackbar('Error updating transaction', 'error');
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        try {
            const result = await window.electron.ipcRenderer.invoke('delete-transaction', transactionId);
            if (result.success) {
                fetchSAPTransactions();
                showSnackbar('Transaction deleted successfully', 'success');
            } else {
                console.error('Failed to delete transaction:', result.error);
                showSnackbar('Failed to delete transaction', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showSnackbar('Error deleting transaction', 'error');
        }
    };

    const renderSAPAuthorizations = () => (
        console.log('renders sap authorization'),
        <Box sx={{ mt: 2 }}>
            <Divider />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>SAP Authorizations</Typography>
            {sapTransactions.map((transaction) => (
                <PermissionCard key={transaction.id}>
                    <CardContent>
                        <Typography variant="h6" align="center" gutterBottom>
                            Transaction: {transaction.transaction_code}
                        </Typography>
                        {transaction.infotypes.map((infotype) => (
                            <SystemCard key={infotype.id}>
                                <CardContent>
                                    <Typography variant="body2">
                                        Infotype: {infotype.infotype_code}
                                    </Typography>
                                    <Typography variant="body2">
                                        Population: {infotype.population}
                                    </Typography>
                                </CardContent>
                            </SystemCard>
                        ))}
                    </CardContent>
                    <IconButton 
                        onClick={() => handleEditTransaction(transaction)}
                        sx={{ position: 'absolute', top: 8, left: 8 }}
                    >
                        <EditIcon />
                    </IconButton>
                    <DeleteButton onClick={() => handleDeleteTransaction(transaction.id)}>
                        <DeleteIcon />
                    </DeleteButton>
                </PermissionCard>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TextField
                    label="New Transaction"
                    value={newTransaction}
                    onChange={(e) => setNewTransaction(e.target.value)}
                    sx={{ flexGrow: 1, mr: 1 }}
                />
                <IconButton onClick={handleAddTransaction}>
                    <AddIcon />
                </IconButton>
            </Box>
        </Box>
    );

    const renderEditTransactionDialog = () => (
        <Dialog open={editTransactionDialogOpen} onClose={() => setEditTransactionDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogContent>
                <TextField
                    label="Transaction Code"
                    value={editingTransaction?.transaction_code || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, transaction_code: e.target.value })}
                    fullWidth
                    margin="normal"
                />
                {editingTransaction?.infotypes.map((infotype, index) => (
                    <Card key={index} sx={{ mt: 2, p: 2, position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                            <IconButton onClick={() => {
                                const updatedInfotypes = editingTransaction.infotypes.filter((_, i) => i !== index);
                                setEditingTransaction({ ...editingTransaction, infotypes: updatedInfotypes });
                            }}>
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                        <TextField
                            label="Infotype Code"
                            value={infotype.infotype_code}
                            onChange={(e) => {
                                const updatedInfotypes = [...editingTransaction.infotypes];
                                updatedInfotypes[index] = { ...infotype, infotype_code: e.target.value };
                                setEditingTransaction({ ...editingTransaction, infotypes: updatedInfotypes });
                            }}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Population"
                            value={infotype.population}
                            onChange={(e) => {
                                const updatedInfotypes = [...editingTransaction.infotypes];
                                updatedInfotypes[index] = { ...infotype, population: e.target.value };
                                setEditingTransaction({ ...editingTransaction, infotypes: updatedInfotypes });
                            }}
                            fullWidth
                            margin="normal"
                        />
                    </Card>
                ))}
                <Button startIcon={<AddIcon />} onClick={() => {
                    setEditingTransaction({
                        ...editingTransaction,
                        infotypes: [...editingTransaction.infotypes, { infotype_code: '', population: '' }]
                    });
                }} sx={{ mt: 2 }}>
                    Add Infotype
                </Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEditTransactionDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTransaction} color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );

    const fetchAttendanceData = async () => {
        if (!employee) return;
        setLoading(true);
        setError(null);
        const startDate = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');
        try {
            const result = await window.electron.hilanAttendance.get(
                employee.hilan_employee_id,
                startDate,
                endDate
            );
            if (result.success && Array.isArray(result.attendance)) {
                setAttendanceData(result.attendance);
            } else {
                throw new Error(result.error || 'Failed to fetch attendance data');
            }
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            setError(error.message);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const result = await window.electron.hilanPermissions.get(employee.hilan_employee_id);
            if (result.success) {
                setPermissions(result.permissions);
            } else {
                console.error('Failed to fetch Hilan permissions:', result.error);
                showSnackbar('Failed to fetch permissions', 'error');
            }
        } catch (error) {
            console.error('Error fetching Hilan permissions:', error);
            showSnackbar('Error fetching permissions', 'error');
        }
    };

    const handleAddPermission = async () => {
        if (!newPermission) return;
        try {
            const result = await window.electron.hilanPermissions.add({
                employeeId: employee.hilan_employee_id,
                permissionName: newPermission,
            });
            if (result.success) {
                setNewPermission('');
                fetchPermissions();
                showSnackbar('Permission added successfully', 'success');
            } else {
                console.error('Failed to add permission:', result.error);
                showSnackbar('Failed to add permission', 'error');
            }
        } catch (error) {
            console.error('Error adding permission:', error);
            showSnackbar('Error adding permission', 'error');
        }
    };

    const handleEditPermission = (permission) => {
        setEditingPermission({...permission, systems: [...permission.systems]});
        setEditDialogOpen(true);
    };

    const handleSavePermission = async () => {
        try {
            const result = await window.electron.hilanPermissions.update(editingPermission);
            if (result.success) {
                fetchPermissions();
                setEditDialogOpen(false);
                showSnackbar('Permission updated successfully', 'success');
            } else {
                console.error('Failed to update permission:', result.error);
                showSnackbar('Failed to update permission', 'error');
            }
        } catch (error) {
            console.error('Error updating permission:', error);
            showSnackbar('Error updating permission', 'error');
        }
    };

    const handleDeletePermission = async (permissionId) => {
        try {
            const result = await window.electron.hilanPermissions.delete(permissionId);
            if (result.success) {
                fetchPermissions();
                showSnackbar('Permission deleted successfully', 'success');
            } else {
                console.error('Failed to delete permission:', result.error);
                showSnackbar('Failed to delete permission', 'error');
            }
        } catch (error) {
            console.error('Error deleting permission:', error);
            showSnackbar('Error deleting permission', 'error');
        }
    };

    const handleAddSystem = () => {
        setEditingPermission({
            ...editingPermission,
            systems: [...editingPermission.systems, { name: '', permissionType: '', population: '' }]
        });
    };

    const handleDeleteSystem = (index) => {
        const updatedSystems = editingPermission.systems.filter((_, i) => i !== index);
        setEditingPermission({...editingPermission, systems: updatedSystems});
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const handleCompare = async () => {
        setLoading(true);
        setError(null);
        try {
            const employeeId = employee[`${system}_employee_id`];
            const otherSystem = system === 'sap' ? 'hilan' : 'sap';
            const result = await window.electron.ipcRenderer.invoke('compare-employee-data', employeeId, system, otherSystem);
            if (result.success) {
                setComparisonData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch comparison data');
            }
        } catch (error) {
            console.error('Error fetching comparison data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setComparisonData(null);
        onClose();
    };

    const renderEmployeeInfo = (data, sys) => {
        const fields = sys === 'sap' ? [
            { label: 'Employee ID', key: 'sap_employee_id' },
            { label: 'Name', key: 'sap_name' },
            { label: 'Title', key: 'sap_title' },
            { label: 'Gender', key: 'sap_gender' },
            { label: 'Birth Date', key: 'sap_birth_date', format: formatDate },
            { label: 'Citizenship', key: 'sap_citizenship' },
            { label: 'Personal ID', key: 'sap_personal_id' },
            { label: 'Relationship Status', key: 'sap_relationship_status' },
            { label: 'Status', key: 'sap_status' },
            { label: 'Company', key: 'sap_company' },
            { label: 'Hospital', key: 'sap_hospital' },
            { label: 'Employee Group', key: 'sap_employee_group' },
            { label: 'Employee Subgroup', key: 'sap_employee_subgroup' },
            { label: 'Department', key: 'sap_department' },
            { label: 'Role', key: 'sap_role' },
            { label: 'Job Title', key: 'sap_job_title' },
            { label: 'Address', key: 'sap_address' },
            { label: 'City', key: 'sap_city' },
            { label: 'Level', key: 'sap_level' },
            { label: 'Email', key: 'sap_email' },
            { label: 'Phone', key: 'sap_phone' },
            { label: 'Employment Start', key: 'sap_employment_start', format: formatDate },
            { label: 'Manager Name', key: 'sap_manager_name' },
            { label: 'Job Percentage', key: 'sap_job_percentage', format: (value) => `${value}%` },
        ] : [
            { label: 'Employee ID', key: 'hilan_employee_id' },
            { label: 'Last Name', key: 'hilan_last_name' },
            { label: 'First Name', key: 'hilan_first_name' },
            { label: 'Personal ID', key: 'hilan_personal_id' },
            { label: 'Birth Date', key: 'hilan_birth_date', format: formatDate },
            { label: 'City', key: 'hilan_city' },
            { label: 'Address', key: 'hilan_address' },
            { label: 'Email', key: 'hilan_email' },
            { label: 'Citizenship', key: 'hilan_citizenship' },
            { label: 'Relationship Status', key: 'hilan_relationship_status' },
            { label: 'Gender', key: 'hilan_gender' },
            { label: 'Phone', key: 'hilan_phone' },
            { label: 'Status', key: 'hilan_status' },
            { label: 'Hospital', key: 'hilan_hospital' },
            { label: 'Department', key: 'hilan_department' },
            { label: 'Title', key: 'hilan_title' },
            { label: 'Job Title', key: 'hilan_job_title' },
            { label: 'Company', key: 'hilan_company' },
            { label: 'Manager Name', key: 'hilan_manager_name' },
            { label: 'Level', key: 'hilan_level' },
            { label: 'Job Percentage', key: 'hilan_job_percentage', format: (value) => `${value}%` },
            { label: 'Employment Start', key: 'hilan_employment_start', format: formatDate },
            { label: 'Group', key: 'hilan_group' },
            { label: 'Role', key: 'hilan_role' },
        ];

        return (
            <Grid container spacing={1}>
                {fields.map((field) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={field.key}>
                        <InfoCard>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {field.label}
                                </Typography>
                                <ValueTypography variant="body1">
                                    {field.format ? field.format(data[field.key]) : data[field.key] || 'N/A'}
                                </ValueTypography>
                            </CardContent>
                        </InfoCard>
                    </Grid>
                ))}
            </Grid>
        );
    };

    const renderAttendanceInfo = () => {
        if (system !== 'hilan') return null;

        if (loading) {
            return <CircularProgress />;
        }

        if (error) {
            return <Typography color="error">{error}</Typography>;
        }

        const getAttendanceForDate = (date) => {
            return attendanceData.find(a => isSameDay(parseISO(a.date), date));
        };

        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateCalendar
                            value={selectedDate}
                            onChange={(newDate) => setSelectedDate(newDate)}
                            renderDay={(day, _value, DayComponentProps) => {
                                const attendance = getAttendanceForDate(day);
                                return (
                                    <Button
                                        {...DayComponentProps}
                                        sx={{
                                            backgroundColor: attendance ? '#4caf50' : 'transparent',
                                            color: attendance ? 'white' : 'inherit',
                                            '&:hover': {
                                                backgroundColor: attendance ? '#45a049' : 'rgba(0, 0, 0, 0.04)',
                                            },
                                        }}
                                    >
                                        {format(day, 'd')}
                                    </Button>
                                );
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                {selectedDate && (
                    <Grid item xs={12}>
                        <Paper elevation={3} style={{ padding: '1rem' }}>
                            <Typography variant="h6">
                                Attendance for {format(selectedDate, 'MMMM d, yyyy')}
                            </Typography>
                            {(() => {
                                const attendance = getAttendanceForDate(selectedDate);
                                if (attendance) {
                                    return (
                                        <>
                                            <Typography>Start Time: {attendance.start_time}</Typography>
                                            <Typography>End Time: {attendance.end_time}</Typography>
                                            <Typography>Attendance Type: {attendance.attendance_type}</Typography>
                                        </>
                                    );
                                } else {
                                    return <Typography>No attendance recorded for this date.</Typography>;
                                }
                            })()}
                        </Paper>
                    </Grid>
                )}
            </Grid>
        );
    };

    const renderHilanPermissions = () => (
        <Box sx={{ mt: 2 }}>
            <Divider />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Hilan Permissions</Typography>
            {permissions.map((permission) => (
                <PermissionCard key={permission.id}>
                    <CardContent>
                        <Typography variant="h6" align="center" gutterBottom>
                            {permission.name}
                        </Typography>
                        {permission.systems.map((system) => (
                            <SystemCard key={system.id}>
                                <CardContent>
                                    <Typography variant="body2">
                                        System: {system.name}
                                    </Typography>
                                    <Typography variant="body2">
                                        Type: {system.permissionType}
                                    </Typography>
                                    <Typography variant="body2">
                                        Population: {system.population}
                                    </Typography>
                                </CardContent>
                            </SystemCard>
                        ))}
                    </CardContent>
                    <IconButton 
                        onClick={() => handleEditPermission(permission)}
                        sx={{ position: 'absolute', top: 8, left: 8 }}
                    >
                        <EditIcon />
                    </IconButton>
                    <DeleteButton onClick={() => handleDeletePermission(permission.id)}>
                        <DeleteIcon />
                    </DeleteButton>
                </PermissionCard>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TextField
                    label="New Permission"
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    sx={{ flexGrow: 1, mr: 1 }}
                />
                <IconButton onClick={handleAddPermission}>
                    <AddIcon />
                </IconButton>
            </Box>
        </Box>
    );

    const renderEditDialog = () => (
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogContent>
                <TextField
                    label="Permission Name"
                    value={editingPermission?.name || ''}
                    onChange={(e) => setEditingPermission({ ...editingPermission, name: e.target.value })}
                    fullWidth
                    margin="normal"
                />
                {editingPermission?.systems.map((system, index) => (
                    <Card key={index} sx={{ mt: 2, p: 2, position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                            <IconButton onClick={() => handleDeleteSystem(index)}>
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                        <TextField
                            label="System Name"
                            value={system.name}
                            onChange={(e) => {
                                const updatedSystems = [...editingPermission.systems];
                                updatedSystems[index] = { ...system, name: e.target.value };
                                setEditingPermission({ ...editingPermission, systems: updatedSystems });
                            }}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Permission Type"
                            value={system.permissionType}
                            onChange={(e) => {
                                const updatedSystems = [...editingPermission.systems];
                                updatedSystems[index] = { ...system, permissionType: e.target.value };
                                setEditingPermission({ ...editingPermission, systems: updatedSystems });
                            }}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Population"
                            value={system.population}
                            onChange={(e) => {
                                const updatedSystems = [...editingPermission.systems];
                                updatedSystems[index] = { ...system, population: e.target.value };
                                setEditingPermission({ ...editingPermission, systems: updatedSystems });
                            }}
                            fullWidth
                            margin="normal"
                        />
                    </Card>
                ))}
                <Button startIcon={<AddIcon />} onClick={handleAddSystem} sx={{ mt: 2 }}>
                    Add System
                </Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSavePermission} color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );

     if (!employee) {
        return (
          <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogContent>
              <CircularProgress />
            </DialogContent>
          </StyledDialog>
        );
    }

    return (
        <StyledDialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {employee?.[system === 'sap' ? 'sap_name' : 'hilan_last_name']} 
                {system !== 'sap' && ` ${employee?.hilan_first_name}`} Details
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <LargeAvatar src="/api/placeholder/200/200" alt={employee?.[system === 'sap' ? 'sap_name' : 'hilan_last_name']} />
                </Box>
                {comparisonData ? (
                    <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                        {renderComparisonView()}
                    </Box>
                ) : (
                    <>
                        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} centered>
                            <Tab label="Employee Info" />
                            {system === 'hilan' && <Tab label="Attendance" />}
                            {system === 'hilan' && <Tab label="Permissions" />}
                            {system === 'sap' && <Tab label="Authorizations" />}
                        </Tabs>
                        <Box sx={{ mt: 2, maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                            <div role="tabpanel" hidden={tabValue !== 0}>
                                {tabValue === 0 && renderEmployeeInfo(employee, system)}
                            </div>
                            <div role="tabpanel" hidden={tabValue !== 1}>
                                {tabValue === 1 && system === 'hilan' && renderAttendanceInfo()}
                            </div>
                            <div role="tabpanel" hidden={tabValue !== 2}>
                                {tabValue === 2 && system === 'hilan' && renderHilanPermissions()}
                            </div>
                            <div role="tabpanel" hidden={tabValue !== 1}>
                                {console.log(tabValue)}
                                {tabValue === 1 && system === 'sap' && renderSAPAuthorizations()}
                            </div>
                        </Box>
                    </>
                )}
                {!comparisonData && (
                    <CompareButton 
                        variant="contained" 
                        color="primary" 
                        onClick={handleCompare}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : `Compare to ${system === 'sap' ? 'Hilan' : 'SAP'}`}
                    </CompareButton>
                )}
                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">Close</Button>
            </DialogActions>
            {renderEditDialog()}
            {renderEditTransactionDialog()}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </StyledDialog>
    );
};

export default EmployeeDetails;