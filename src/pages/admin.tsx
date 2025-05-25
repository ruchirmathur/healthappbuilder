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
  ListItemIcon,
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
  StepLabel,
  CircularProgress,
  TextField,
  Alert,
  Collapse,
  Divider,
  useTheme,
  Fade,
  Tooltip,
} from "@mui/material";
import {
  AccountCircle,
  CheckCircle,
  CloudUpload,
  Security,
  Code,
  Build,
  Palette,
  Dashboard as DashboardIcon,
  ArrowForward,
  ArrowBack,
  LocalHospital,
  Feedback,
  Group,
  PriceChange,
  RecordVoiceOver,
  AddCircleOutline,
  ListAlt,
} from "@mui/icons-material";
import { useAuth0 } from "@auth0/auth0-react";
import { v4 as uuidv4 } from "uuid";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";

const drawerWidth = 240;
const API_HOST = process.env.REACT_APP_API_HOST || "http://127.0.0.1:5000";
const RETRIEVE_ALL_URL = `${API_HOST}/retrieve-all`;
const WRITE_URL = `${API_HOST}/write`;
const TRIGGER_DEPLOY_URL = `${API_HOST}/trigger-deploy`;
const CREATE_APP_URL = `${API_HOST}/createApp`;

const steps = [
  "App Details",
  "Select Use Case",
  "Appearance",
  "Build & Deploy",
  "Review",
];

const useCaseOptions = [
  {
    label: "Healthcare Underwriter Dashboard",
    icon: <LocalHospital sx={{ fontSize: 32, color: "#1976d2" }} />,
  },
  {
    label: "User Feedback Analysis Dashboard",
    icon: <Feedback sx={{ fontSize: 32, color: "#43a047" }} />,
  },
  {
    label: "Member Dashboard",
    icon: <Group sx={{ fontSize: 32, color: "#fbc02d" }} />,
  },
  {
    label: "Healthcare Price Transparency",
    icon: <PriceChange sx={{ fontSize: 32, color: "#6d4c41" }} />,
  },
  {
    label: "Voice enabled Healthcare Price Transparency",
    icon: <RecordVoiceOver sx={{ fontSize: 32, color: "#d84315" }} />,
  },
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

interface FormField {
  name: string;
  label: string;
  helper: string;
  type?: string;
}

const apiFields: FormField[] = [
  { name: "repo", label: "API Repository URL", helper: "e.g. https://github.com/yourorg/your-api-repo" },
  { name: "workflow_id", label: "CI/CD Workflow ID", helper: "The workflow ID for your deployment pipeline" },
  { name: "api_url", label: "API URL", helper: "e.g. https://api.yourdomain.com" },
];

const webSecFields: FormField[] = [
  { name: "app", label: "App Name", helper: "The application name" },
  { name: "org_name", label: "Organization Name", helper: "Your organization's display name" },
  { name: "email", label: "Contact Email", helper: "Contact email for notifications", type: "email" },
  { name: "callback_urls", label: "Callback URL", helper: "Allowed callback URL (OAuth/OIDC)" },
  { name: "logout_urls", label: "Logout URL", helper: "Allowed logout redirect URL" },
  { name: "initiate_login_uri", label: "Initiate Login URI", helper: "e.g. https://yourapp.com/login" },
];

const webBuildFields: FormField[] = [
  { name: "repo", label: "Frontend Repository URL", helper: "e.g. https://github.com/yourorg/your-frontend-repo" },
  { name: "workflow_id", label: "CI/CD Workflow ID", helper: "The workflow ID for your frontend deployment" },
  { name: "client_id", label: "Client ID", helper: "The client ID from your identity provider" },
  { name: "okta_domain", label: "Okta Domain", helper: "e.g. dev-123456.okta.com" },
  { name: "redirect_url", label: "Redirect URL", helper: "Where users are redirected after login" },
];

export const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const { logout, user, getIdTokenClaims, isAuthenticated } = useAuth0();
  const [currentView, setCurrentView] = useState("Create a New App");
  const [appsData, setAppsData] = useState<AppData[]>([]);
  const [orgName, setOrgName] = useState<string | undefined>();
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    id: "",
    appName: "",
    customerName: "",
    selectedUseCase: "",
    color: "",
  });
  const [color, setColor] = useColor("#1976d2");
  const [activeStep, setActiveStep] = useState(0);
  const [appNameError, setAppNameError] = useState(false);
  const [customerNameError, setCustomerNameError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [buildExpandedStep, setBuildExpandedStep] = useState(0);
  const [buildCompleted, setBuildCompleted] = useState<{ [key: number]: boolean }>({});
  const [apiDeploying, setApiDeploying] = useState(false);

  const [apiForm, setApiForm] = useState<{ [key: string]: string }>({
    repo: "",
    workflow_id: "",
    api_url: "",
  });

  const [webSecForm, setWebSecForm] = useState({
    app: "",
    org_name: "",
    email: "",
    callback_urls: "",
    logout_urls: "",
    initiate_login_uri: "",
  });

  const [webBuildForm, setWebBuildForm] = useState<{ [key: string]: string }>({
    repo: "",
    workflow_id: "",
    client_id: "",
    okta_domain: "",
    redirect_url: "",
  });

  useEffect(() => {
    if (workflowData.appName && workflowData.customerName) {
      setWebSecForm(prev => ({
        ...prev,
        app: workflowData.appName,
        org_name: workflowData.customerName
      }));
    }
  }, [workflowData.appName, workflowData.customerName]);

  // Always sync color to workflowData for review and write API
  useEffect(() => {
    setWorkflowData(prev => ({
      ...prev,
      color: color.hex
    }));
  }, [color]);

  const triggerDeploy = async () => {
    setApiDeploying(true);
    setApiError(null);
    try {
      const response = await fetch(TRIGGER_DEPLOY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: apiForm.repo,
          workflow_id: apiForm.workflow_id,
          inputs: {
            api_url: apiForm.api_url
          }
        }),
      });
      if (!response.ok) throw new Error("Deployment failed");
      setBuildCompleted(prev => ({ ...prev, 0: true }));
      setBuildExpandedStep(1);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Deployment error");
    } finally {
      setApiDeploying(false);
    }
  };

  // Security & Auth Configuration step
  const createAppOnSecurityStep = async () => {
    setApiError(null);
    try {
      const body = {
        app: webSecForm.app,
        org_name: webSecForm.org_name,
        email: webSecForm.email,
        callback_urls: webSecForm.callback_urls
          ? webSecForm.callback_urls.split(",").map(s => s.trim()).filter(Boolean)
          : [""],
        logout_urls: webSecForm.logout_urls
          ? webSecForm.logout_urls.split(",").map(s => s.trim()).filter(Boolean)
          : [""],
        initiate_login_uri: webSecForm.initiate_login_uri || "h"
      };
      const response = await fetch(CREATE_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("App creation failed");
      setBuildCompleted(prev => ({ ...prev, 1: true }));
      setBuildExpandedStep(2);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "App creation error");
    }
  };

  // Frontend Deployment step: trigger-deploy with api_url
  const handleBuildStepContinue = async (step: number) => {
    if (step === 0) {
      if (validateApiForm()) await triggerDeploy();
    } else if (step === 1) {
      if (validateWebSecForm()) {
        await createAppOnSecurityStep();
      }
    } else if (step === 2) {
      if (validateWebBuildForm()) {
        setApiDeploying(true);
        setApiError(null);
        try {
          const response = await fetch(TRIGGER_DEPLOY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              repo: webBuildForm.repo,
              workflow_id: webBuildForm.workflow_id,
              client_id: webBuildForm.client_id,
              okta_domain: webBuildForm.okta_domain,
              redirect_url: webBuildForm.redirect_url,
              api_url: apiForm.api_url,
            }),
          });
          if (!response.ok) throw new Error("Frontend deployment failed");
          setBuildCompleted(prev => ({ ...prev, 2: true }));
          setActiveStep(4);
        } catch (error) {
          setApiError(error instanceof Error ? error.message : "Frontend deployment error");
        } finally {
          setApiDeploying(false);
        }
      }
    }
  };

  const validateApiForm = () => apiFields.every(f => apiForm[f.name].trim() !== "");
  const validateWebSecForm = () =>
    webSecForm.app.trim() &&
    webSecForm.org_name.trim() &&
    webSecForm.callback_urls.trim() &&
    webSecForm.logout_urls.trim();
  const validateWebBuildForm = () => webBuildFields.every(f => webBuildForm[f.name].trim() !== "");

  const fetchAppsData = async () => {
    setApiError(null);
    setLoading(true);
    try {
      const response = await fetch(RETRIEVE_ALL_URL);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setAppsData(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        status: item.status,
      })));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      getIdTokenClaims().then(claims => setOrgName(claims?.org_name));
    }
  }, [isAuthenticated, getIdTokenClaims]);

  useEffect(() => {
    if (currentView === "Review Existing App") fetchAppsData();
  }, [currentView]);

  useEffect(() => {
    if (activeStep === 0 && !workflowData.id) {
      setWorkflowData((prev) => ({ ...prev, id: uuidv4() }));
    }
  }, [activeStep, workflowData.id]);

  const handleNext = async () => {
    setApiError(null);
    if (activeStep === 0) {
      const isAppNameEmpty = !workflowData.appName.trim();
      const isCustomerNameEmpty = !workflowData.customerName.trim();
      setAppNameError(isAppNameEmpty);
      setCustomerNameError(isCustomerNameEmpty);
      if (isAppNameEmpty || isCustomerNameEmpty) return;
    }
    setLoading(true);
    try {
      const response = await fetch(WRITE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowData.id,
          TenantId: workflowData.customerName,
          appName: workflowData.appName,
          selectedUseCase: workflowData.selectedUseCase,
          color: color.hex
        }),
      });
      if (!response.ok) throw new Error("API error");
      setActiveStep(prev => prev + 1);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "API error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      setApiError(null);
    }
  };

  const allBuildStepsCompleted = () =>
    buildCompleted[0] && buildCompleted[1] && buildCompleted[2];

  const renderBuildStep = () => (
    <Card sx={{ mb: 2, boxShadow: theme.shadows[4], borderRadius: 4, bgcolor: "#f8fafb" }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3, display: "flex", alignItems: "center", color: theme.palette.primary.main }}>
          <Build sx={{ mr: 1.5, fontSize: 32 }} />
          Build & Deploy
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Box onClick={() => setBuildExpandedStep(0)} sx={{ p: 2, cursor: "pointer" }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "50%",
              bgcolor: buildCompleted[0] ? theme.palette.success.main : theme.palette.background.paper,
              display: "flex", alignItems: "center", justifyContent: "center", mr: 2,
              border: `2px solid ${theme.palette.divider}`,
            }}>
              {buildCompleted[0] ? <CheckCircle color="inherit" /> : <CloudUpload color="action" />}
            </Box>
            <Typography variant="h6">Backend Configuration</Typography>
          </Box>
          <Collapse in={buildExpandedStep === 0}>
            <Box sx={{ pl: 6 }}>
              {apiFields.map(field => (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  value={apiForm[field.name]}
                  onChange={e => setApiForm({ ...apiForm, [field.name]: e.target.value })}
                  helperText={field.helper}
                  type={field.type || "text"}
                  sx={{ mb: 3 }}
                />
              ))}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => handleBuildStepContinue(0)}
                  disabled={!validateApiForm() || apiDeploying}
                  endIcon={apiDeploying ? <CircularProgress size={20} /> : <ArrowForward />}
                >
                  {apiDeploying ? "Deploying..." : "Continue"}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box onClick={() => buildCompleted[0] && setBuildExpandedStep(1)} sx={{ p: 2 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "50%",
              bgcolor: buildCompleted[1] ? theme.palette.success.main : theme.palette.background.paper,
              display: "flex", alignItems: "center", justifyContent: "center", mr: 2,
              border: `2px solid ${theme.palette.divider}`,
            }}>
              {buildCompleted[1] ? <CheckCircle color="inherit" /> : <Security color="action" />}
            </Box>
            <Typography variant="h6">Security & Auth Configuration</Typography>
          </Box>
          <Collapse in={buildExpandedStep === 1}>
            <Box sx={{ pl: 6 }}>
              {webSecFields.map(field => (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  value={(webSecForm as any)[field.name]}
                  onChange={e => setWebSecForm({ ...webSecForm, [field.name]: e.target.value })}
                  helperText={field.helper}
                  type={field.type || "text"}
                  disabled={field.name === "app" || field.name === "org_name"}
                  sx={{ mb: 3 }}
                />
              ))}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => handleBuildStepContinue(1)}
                  disabled={!validateWebSecForm()}
                  sx={{ borderRadius: 3, px: 4 }}
                  endIcon={<ArrowForward />}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box onClick={() => buildCompleted[1] && setBuildExpandedStep(2)} sx={{ p: 2 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "50%",
              bgcolor: buildCompleted[2] ? theme.palette.success.main : theme.palette.background.paper,
              display: "flex", alignItems: "center", justifyContent: "center", mr: 2,
              border: `2px solid ${theme.palette.divider}`,
            }}>
              {buildCompleted[2] ? <CheckCircle color="inherit" /> : <Code color="action" />}
            </Box>
            <Typography variant="h6">Frontend Deployment</Typography>
          </Box>
          <Collapse in={buildExpandedStep === 2}>
            <Box sx={{ pl: 6 }}>
              {webBuildFields.map(field => (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  value={webBuildForm[field.name]}
                  onChange={e => setWebBuildForm({ ...webBuildForm, [field.name]: e.target.value })}
                  helperText={field.helper}
                  sx={{ mb: 3 }}
                />
              ))}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => handleBuildStepContinue(2)}
                  disabled={!validateWebBuildForm() || apiDeploying}
                  endIcon={apiDeploying ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {apiDeploying ? "Deploying..." : "Deploy Now"}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1, backgroundColor: "#153a5b" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "center" }}>
            <DashboardIcon sx={{ mr: 1 }} />
            Multi-Tenant GenAI App Builder
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography sx={{ mr: 2 }}>{user?.name} — {orgName}</Typography>
            <IconButton color="inherit" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
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
            background: "#1a2740",
            borderRight: `1px solid #223355`,
            color: "#fff",
            pt: 2,
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItemButton
            selected={currentView === "Create a New App"}
            onClick={() => setCurrentView("Create a New App")}
            sx={{
              "&.Mui-selected": {
                bgcolor: "#1976d2",
                color: "#fff",
                "&:hover": { bgcolor: "#1565c0" },
              },
              borderRadius: 2,
              mx: 1,
              my: 0.5,
              mb: 1,
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <AddCircleOutline />
            </ListItemIcon>
            <ListItemText primary="Create a New App" />
          </ListItemButton>
          <ListItemButton
            selected={currentView === "Review Existing App"}
            onClick={() => setCurrentView("Review Existing App")}
            sx={{
              "&.Mui-selected": {
                bgcolor: "#1976d2",
                color: "#fff",
                "&:hover": { bgcolor: "#1565c0" },
              },
              borderRadius: 2,
              mx: 1,
              my: 0.5,
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <ListAlt />
            </ListItemIcon>
            <ListItemText primary="Review Existing App" />
          </ListItemButton>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#132238",
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
              maxWidth: 1200,
              mx: "auto",
              mt: 6,
              borderRadius: 6,
              boxShadow: 14,
              bgcolor: "#f7fafd",
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
              <Stepper alternativeLabel activeStep={activeStep} sx={{ mb: 5 }}>
                {steps.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              {activeStep === 0 && (
                <Fade in>
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
                      <DashboardIcon sx={{ fontSize: 36, mr: 1 }} />
                      Application Details
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 1,
                        textAlign: "center",
                        color: "text.secondary",
                        maxWidth: 700,
                      }}
                    >
                      Start by providing your application name and the customer or organization name. These details will be used to identify and personalize your GenAI app.
                    </Typography>
                    <Box sx={{ width: "60%" }}>
                      <TextField
                        fullWidth
                        required
                        variant="outlined"
                        label="Application Name"
                        value={workflowData.appName}
                        onChange={(e) =>
                          setWorkflowData({ ...workflowData, appName: e.target.value })
                        }
                        error={appNameError}
                        helperText={appNameError ? "Application Name is required" : ""}
                        inputProps={{ style: { fontSize: 18 } }}
                        InputLabelProps={{ style: { fontSize: 18 } }}
                        sx={{
                          bgcolor: "#fafbfc",
                          borderRadius: 2,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                          mb: 3,
                        }}
                      />
                      <TextField
                        fullWidth
                        required
                        variant="outlined"
                        label="Customer/Organization Name"
                        value={workflowData.customerName}
                        onChange={(e) =>
                          setWorkflowData({
                            ...workflowData,
                            customerName: e.target.value,
                          })
                        }
                        error={customerNameError}
                        helperText={customerNameError ? "Customer/Organization Name is required" : ""}
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
                </Fade>
              )}
              {activeStep === 1 && (
                <Fade in>
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
                      <DashboardIcon sx={{ fontSize: 36, mr: 1 }} />
                      Select Use Case
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        textAlign: "center",
                        color: "text.secondary",
                        maxWidth: 700,
                        mx: "auto",
                      }}
                    >
                      Choose the type of GenAI dashboard or solution you want to build.
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      {useCaseOptions.map((option) => (
                        <Tooltip title={option.label} arrow key={option.label}>
                          <Card
                            onClick={() =>
                              setWorkflowData({
                                ...workflowData,
                                selectedUseCase: option.label,
                              })
                            }
                            sx={{
                              cursor: "pointer",
                              borderRadius: 4,
                              width: 320,
                              minHeight: 140,
                              boxShadow:
                                workflowData.selectedUseCase === option.label
                                  ? "0 0 0 3px #1976d2"
                                  : theme.shadows[2],
                              bgcolor:
                                workflowData.selectedUseCase === option.label
                                  ? "#e3f2fd"
                                  : "#fff",
                              textAlign: "center",
                              p: 3,
                              transition: "all 0.2s",
                              "&:hover": {
                                boxShadow: "0 0 0 3px #1976d2",
                              },
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                              {option.icon}
                            </Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                color:
                                  workflowData.selectedUseCase === option.label
                                    ? "#1976d2"
                                    : "#333",
                              }}
                            >
                              {option.label}
                            </Typography>
                          </Card>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                </Fade>
              )}
              {activeStep === 2 && (
                <Fade in>
                  <Box>
                    <Typography variant="h4" sx={{
                      mb: 1,
                      fontWeight: 700,
                      textAlign: "center",
                      letterSpacing: 1,
                      color: "#1976d2",
                    }}>
                      <Palette sx={{ fontSize: 36, mr: 1 }} />
                      Appearance & Branding
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        textAlign: "center",
                        color: "text.secondary",
                        maxWidth: 700,
                        mx: "auto",
                      }}
                    >
                      Personalize your dashboard by choosing a color palette that matches your brand or customer preferences.
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexDirection: 'column',
                        mt: 3 
                      }}
                    >
                      <Paper 
                        elevation={3}
                        sx={{ 
                          p: 4, 
                          borderRadius: 3, 
                          width: 380,
                          bgcolor: '#fff'
                        }}
                      >
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                            Select Brand Color
                          </Typography>
                        </Box>
                        <ColorPicker
                          color={color}
                          onChange={setColor}
                        />
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Selected: <b>{color.hex}</b>
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  </Box>
                </Fade>
              )}
              {activeStep === 3 && (
                <Fade in>
                  <Box>
                    {renderBuildStep()}
                  </Box>
                </Fade>
              )}
              {activeStep === 4 && (
                <Fade in>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ mb: 2, color: "#1976d2", textAlign: "center", fontWeight: 700 }}
                    >
                      <CheckCircle sx={{ fontSize: 36, mr: 1 }} />
                      Review & Confirm
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        textAlign: "center",
                        color: "text.secondary",
                        maxWidth: 700,
                        mx: "auto",
                      }}
                    >
                      Review your application details before final deployment. Make sure all information is correct.
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell><b>App Name</b></TableCell>
                            <TableCell>{workflowData.appName}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><b>Customer/Organization</b></TableCell>
                            <TableCell>{workflowData.customerName}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><b>Use Case</b></TableCell>
                            <TableCell>{workflowData.selectedUseCase}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><b>Brand Color</b></TableCell>
                            <TableCell>
                              <Box sx={{
                                display: "inline-block",
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: workflowData.color,
                                border: "2px solid #eee",
                                verticalAlign: "middle",
                                mr: 1,
                              }} />
                              {workflowData.color}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Fade>
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
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              {activeStep !== steps.length - 1 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={
                    loading ||
                    (activeStep === 3 && !allBuildStepsCompleted())
                  }
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    px: 3,
                    boxShadow: 1,
                    textTransform: "none",
                  }}
                  endIcon={<ArrowForward />}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Next"}
                </Button>
              )}
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
              sx={{ color: "#1976d2", textAlign: "center", mb: 2 }}
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
