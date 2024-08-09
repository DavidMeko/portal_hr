import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Paper, Tabs, Tab, CircularProgress, Avatar, Card, CardContent, Box } from '@mui/material';
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

const EmployeeDetails = ({ open, onClose, employee, system }) => {
    const [tabValue, setTabValue] = useState(0);
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [comparisonData, setComparisonData] = useState(null);

    useEffect(() => {
        if (system === 'hilan' && employee) {
            fetchAttendanceData();
        }
    }, [employee, system]);

    const fetchAttendanceData = async () => {
        if (!employee) return;
        setLoading(true);
        setError(null);
        const startDate = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');
        try {
            const result = await window.electron.ipcRenderer.invoke('get-hilan-attendance', 
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

    const renderComparisonView = () => {
        if (!comparisonData) return null;
    
        const fields = [
            { label: 'Employee ID', sapKey: 'sap_employee_id', hilanKey: 'hilan_employee_id' },
            { label: 'Name', sapKey: 'sap_name', hilanKey: 'hilan_last_name' },
            { label: 'Title', sapKey: 'sap_title', hilanKey: 'hilan_title' },
            { label: 'Gender', sapKey: 'sap_gender', hilanKey: 'hilan_gender' },
            { label: 'Birth Date', sapKey: 'sap_birth_date', hilanKey: 'hilan_birth_date', format: formatDate },
            { label: 'Citizenship', sapKey: 'sap_citizenship', hilanKey: 'hilan_citizenship' },
            { label: 'Personal ID', sapKey: 'sap_personal_id', hilanKey: 'hilan_personal_id' },
            { label: 'Relationship Status', sapKey: 'sap_relationship_status', hilanKey: 'hilan_relationship_status' },
            { label: 'Status', sapKey: 'sap_status', hilanKey: 'hilan_status' },
            { label: 'Company', sapKey: 'sap_company', hilanKey: 'hilan_company' },
            { label: 'Hospital', sapKey: 'sap_hospital', hilanKey: 'hilan_hospital' },
            { label: 'Department', sapKey: 'sap_department', hilanKey: 'hilan_department' },
            { label: 'Role', sapKey: 'sap_role', hilanKey: 'hilan_role' },
            { label: 'Job Title', sapKey: 'sap_job_title', hilanKey: 'hilan_job_title' },
            { label: 'Address', sapKey: 'sap_address', hilanKey: 'hilan_address' },
            { label: 'City', sapKey: 'sap_city', hilanKey: 'hilan_city' },
            { label: 'Level', sapKey: 'sap_level', hilanKey: 'hilan_level' },
            { label: 'Email', sapKey: 'sap_email', hilanKey: 'hilan_email' },
            { label: 'Phone', sapKey: 'sap_phone', hilanKey: 'hilan_phone' },
            { label: 'Employment Start', sapKey: 'sap_employment_start', hilanKey: 'hilan_employment_start', format: formatDate },
            { label: 'Manager Name', sapKey: 'sap_manager_name', hilanKey: 'hilan_manager_name' },
            { label: 'Job Percentage', sapKey: 'sap_job_percentage', hilanKey: 'hilan_job_percentage', format: (value) => `${value}%` }
        ];
    
        return (
            <Grid container spacing={1}>
                {fields.map((field) => (
                    <Grid item xs={12} key={field.label}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <InfoCard>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {field.label} (SAP)
                                        </Typography>
                                        <ValueTypography variant="body1">
                                            {field.format ? field.format(employee[field.sapKey]) : employee[field.sapKey] || 'N/A'}
                                        </ValueTypography>
                                    </CardContent>
                                </InfoCard>
                            </Grid>
                            <Grid item xs={6}>
                                <InfoCard>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {field.label} (Hilan)
                                        </Typography>
                                        <ValueTypography variant="body1">
                                            {field.format ? field.format(comparisonData[field.hilanKey]) : comparisonData[field.hilanKey] || 'N/A'}
                                        </ValueTypography>
                                    </CardContent>
                                </InfoCard>
                            </Grid>
                        </Grid>
                    </Grid>
                ))}
            </Grid>
        );
    };

    if (!employee) return null;

    return (
        <StyledDialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                {employee[system === 'sap' ? 'sap_name' : 'hilan_last_name'] + ' ' + employee[system === 'sap' ? '' : 'hilan_first_name']} Details
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <LargeAvatar src="/api/placeholder/200/200" alt={employee[system === 'sap' ? 'sap_name' : 'hilan_last_name']} />
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
                        </Tabs>
                        <Box sx={{ mt: 2, maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                            <div role="tabpanel" hidden={tabValue !== 0}>
                                {tabValue === 0 && renderEmployeeInfo(employee, system)}
                            </div>
                            <div role="tabpanel" hidden={tabValue !== 1}>
                                {tabValue === 1 && system === 'hilan' && renderAttendanceInfo()}
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
        </StyledDialog>
    );
};

export default EmployeeDetails;