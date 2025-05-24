import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  CssBaseline,
  IconButton,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Card,
  CardContent,
  Stepper,
  Step,
  StepButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  TextField,
  Alert,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useAuth0 } from "@auth0/auth0-react";
import { v4 as uuidv4 } from "uuid";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";

const drawerWidth = 240;

const steps = ["App Name", "Use Cases", "Frontend", "Build", "Review"];

const useCaseOptions = [
  "Healthcare Underwriter Dashboard",
  "User Feedback Analysis Dashboard",
  "Member Dashboard",
  "Healthcare Price Transparency",
  "Voice enabled Healthcare Price Transparency",
];

interface AppData {
  id: string;
  name: string;
  url: string;
  status: string;
}

interface WorkflowData {
  id: string;
  appName: string;
  customerName: string;
  selectedUseCase: string;
  color?: string;
}

function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 10000) {
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("API did not respond in time.")), timeout)
    ),
  ]);
}

const API_HOST = process.env.REACT_APP_API_HOST;

export const AdminDashboard: React.FC = () => {
  const { logout, user ,getIdTokenClaims,isAuthenticated } = useAuth0();
  const [currentView, setCurrentView] = useState("Create a New App");
  const [appsData, setAppsData] = useState<AppData[]>([]);
  const [orgName, setOrgName] =useState<string | undefined>(); 
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    id: "",
    appName: "",
    customerName: "",
    selectedUseCase: "",
    color: "",
  });
  const [color, setColor] = useColor("#121212");
  const [activeStep, setActiveStep] = useState(0);

  const [appNameError, setAppNameError] = useState(false);
  const [customerNameError, setCustomerNameError] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  
  // Fetch Existing Apps Data on "Review Existing App" Selection
  const fetchAppsData = async () => {
    setApiError(null);
    setLoading(true);
    try {
      const response: any = await fetchWithTimeout(`${API_HOST}/retrieve-all`);
      if (!response.ok) {
        throw new Error(`Error fetching apps: ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAppsData(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            url: item.url,
            status: item.status,
          }))
        );
      } else {
        throw new Error("Invalid data format from server.");
      }
    } catch (error: any) {
      setApiError(error.message || "Failed to fetch applications.");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
     if (isAuthenticated) {
      getIdTokenClaims().then((claims) => {
        return setOrgName(claims?.org_name); // or claims['org_name']
      });
    }
  }, [getIdTokenClaims, isAuthenticated]);

  useEffect(() => {
    if (currentView === "Review Existing App") {
      fetchAppsData();
    }
    // eslint-disable-next-line
  }, [currentView]);

  // Assign a UUID when starting a new workflow
  useEffect(() => {
    if (activeStep === 0 && !workflowData.id) {
      setWorkflowData((prev) => ({ ...prev, id: uuidv4() }));
    }
  }, [activeStep, workflowData.id]);

  // Handle Next Button Click
  const handleNext = async () => {
    setApiError(null);

    if (activeStep === 0) {
      const isAppNameEmpty = !workflowData.appName.trim();
      const isCustomerNameEmpty = !workflowData.customerName?.trim();
      setAppNameError(isAppNameEmpty);
      setCustomerNameError(isCustomerNameEmpty);
      if (isAppNameEmpty || isCustomerNameEmpty) {
        return;
      }
    }

    // Always include id and TenantId (from customerName) at the top level
    let payload: any = {
      id: workflowData.id,
      TenantId: workflowData.customerName,
      appName: workflowData.appName,
      selectedUseCase: workflowData.selectedUseCase,
    };
    // Only include color from step 2 onward
    if (activeStep >= 2) {
      payload.color = color.hex;
    }

    // Update workflowData state with color when on or after step 2
    if (activeStep >= 2) {
      setWorkflowData((prev) => ({ ...prev, color: color.hex }));
    }

    setLoading(true);
    try {
      // On last step before review, submit to /write
      if (activeStep === 3) {
        const response: any = await fetchWithTimeout(`${API_HOST}/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`Error saving app: ${response.statusText}`);
        }
        setCurrentView("Review Existing App");
        setLoading(false);
        return;
      }

      // API call on every Next (except last step)
      const response: any = await fetchWithTimeout(`${API_HOST}/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          step: activeStep,
        }),
      });
      if (!response.ok) {
        throw new Error(`Step API error: ${response.statusText}`);
      }
      setActiveStep(activeStep + 1);
    } catch (error: any) {
      setApiError(error.message || "API call failed or did not respond.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Back Button Click
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setApiError(null);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "#1976d2",
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, textAlign: "center" }}
          >
            Build Multi Tenant GenAI App Builder
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography sx={{ mr: 2 }}> {user?.name} — {orgName}</Typography>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <List>
          {["Create a New App", "Review Existing App"].map((text) => (
            <ListItemButton
              key={text}
              selected={currentView === text}
              onClick={() => setCurrentView(text)}
            >
              <ListItemText primary={text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100vh",
        }}
      >
        {currentView === "Create a New App" && (
          <Card
            sx={{
              width: "100%",
              maxWidth: 700,
              mx: "auto",
              mt: 8,
              borderRadius: 5,
              boxShadow: 12,
              bgcolor: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: 0,
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                p: 6,
                pb: 0,
              }}
            >
              {apiError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {apiError}
                </Alert>
              )}
              <Stepper nonLinear activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepButton onClick={() => setActiveStep(index)}>
                      {label}
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
              {activeStep === 0 && (
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      textAlign: "center",
                      letterSpacing: 1,
                      color: "#1976d2",
                    }}
                  >
                    Enter Application Details
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 1,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    Please provide the <b>App Name</b> and <b>Customer Name</b> to proceed.
                  </Typography>
                  <Box sx={{ width: "80%" }}>
                    <TextField
                      fullWidth
                      required
                      variant="outlined"
                      label="App Name"
                      value={workflowData.appName}
                      onChange={(e) =>
                        setWorkflowData({ ...workflowData, appName: e.target.value })
                      }
                      error={appNameError}
                      helperText={appNameError ? "App Name is required" : ""}
                      inputProps={{ style: { fontSize: 18 } }}
                      InputLabelProps={{ style: { fontSize: 18 } }}
                      sx={{
                        bgcolor: "#fafbfc",
                        borderRadius: 2,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",... mb: 3,
                      }}
                    />
                    <TextField
                      fullWidth
                      required
                      variant="outlined"
                      label="Customer Name"
                      value={workflowData.customerName}
                      onChange={(e) =>
                        setWorkflowData({
                          ...workflowData,
                          customerName: e.target.value,
                        })
                      }
                      error={customerNameError}
                      helperText={customerNameError ? "Customer Name is required" : ""}
                      inputProps={{ style: { fontSize: 18 } }}
                      InputLabelProps={{ style: { fontSize: 18 } }}
                      sx={{
                        bgcolor: "#fafbfc",
                        borderRadius: 2,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                      }}
                    />
                  </Box>
                </Box>
              )}
              {activeStep === 1 && (
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      textAlign: "center",
                      letterSpacing: 1,
                      color: "#1976d2",
                    }}
                  >
                    Select a Use Case
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    Choose the dashboard or solution you want to build.
                  </Typography>
                  <RadioGroup
                    value={workflowData.selectedUseCase}
                    onChange={(e) =>
                      setWorkflowData({
                        ...workflowData,
                        selectedUseCase: e.target.value,
                      })
                    }
                  >
                    {useCaseOptions.map((useCase) => (
                      <FormControlLabel
                        key={useCase}
                        value={useCase}
                        control={<Radio />}
                        label={
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {useCase}
                          </Typography>
                        }
                        sx={{
                          mb: 2,
                          ml: 2,
                        }}
                      />
                    ))}
                  </RadioGroup>
                </Box>
              )}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h4" sx={{
                    mb: 1,
                    fontWeight: 700,
                    textAlign: "center",
                    letterSpacing: 1,
                    color: "#1976d2",
                  }}>
                    Customize Frontend Appearance
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    Choose a color palette for your dashboard.
                  </Typography>
                  <ColorPicker
                    height={180}
                    color={color}
                    onChange={setColor}
                  />
                </Box>
              )}
              {activeStep === 3 && (
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" sx={{
                    mb: 1,
                    fontWeight: 700,
                    textAlign: "center",
                    letterSpacing: 1,
                    color: "#1976d2",
                  }}>
                    Build and Deploy
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    Review your configuration and deploy your application.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{
                      borderRadius: 3,
                      fontWeight: 600,
                      px: 4,
                      boxShadow: 2,
                      mt: 2,
                    }}
                    onClick={() => alert("Deployment initiated")}
                  >
                    Deploy Application
                  </Button>
                </Box>
              )}
              {activeStep === 4 && (
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ mb: 2, color: "#1976d2", textAlign: "center", fontWeight: 700 }}
                  >
                    Review Your Data
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>App Name</TableCell>
                          <TableCell>{workflowData.appName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Customer Name</TableCell>
                          <TableCell>{workflowData.customerName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Use Case</TableCell>
                          <TableCell>{workflowData.selectedUseCase}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Color</TableCell>
                          <TableCell>{workflowData.color}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 4,
                pt: 2,
                borderTop: "1px solid #f0f0f0",
                bgcolor: "#f9f9f9",
              }}
            >
              {activeStep !== 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBack}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    px: 3,
                    boxShadow: 1,
                    textTransform: "none",
                  }}
                >
                  Back
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  px: 3,
                  boxShadow: 1,
                  textTransform: "none",
                }}
              >
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : activeStep === steps.length - 1
                  ? "Submit"
                  : "Next"}
              </Button>
            </Box>
          </Card>
        )}
        {currentView === "Review Existing App" && (
          <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: "auto" }}>
            {apiError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {apiError}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchAppsData}
                  sx={{ ml: 2 }}
                >
                  Retry
                </Button>
              </Alert>
            )}
            <Typography
              variant="h6"
              sx={{ color: "blue", textAlign: "center", mb: 2 }}
            >
              Existing Applications
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appsData.map((app, index) => (
                    <TableRow
                      key={app.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
                        "&:hover": { backgroundColor: "#f0f0f0" },
                      }}
                    >
                      <TableCell>{app.id}</TableCell>
                      <TableCell>{app.name}</TableCell>
                      <TableCell>
                        {app.url ? (
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            {app.url}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {app.status === "in-progress" ? (
                          <CircularProgress size={20} />
                        ) : (
                          app.status
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};
