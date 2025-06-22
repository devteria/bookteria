import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CircularProgress,
  Typography,
  Avatar,
  Divider,
  TextField,
  Button,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import dayjs from "dayjs";
import {
  getMyInfo,
  updateProfile,
  uploadAvatar,
} from "../services/userService";
import { isAuthenticated, logOut } from "../services/authenticationService";
import Scene from "./Scene";

export default function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getUserDetails = async () => {
    try {
      const response = await getMyInfo();
      const data = response.data;

      setUserDetails(data.result);
      // Initialize form fields with current values
      setFirstName(data.result.firstName || "");
      setLastName(data.result.lastName || "");
      setEmail(data.result.email || "");
      setCity(data.result.city || "");
      setDob(data.result.dob ? dayjs(data.result.dob) : null);
    } catch (error) {
      if (error.response?.status === 401) {
        logOut();
        navigate("/login");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      // Prepare the data for update
      const profileData = {
        firstName,
        lastName,
        email,
        city,
        dob: dob ? dob.format("YYYY-MM-DD") : null,
      };

      await updateProfile(profileData);

      const updatedDetails = {
        ...userDetails,
        ...profileData,
      };

      setUserDetails(updatedDetails);

      // Show success message
      setSnackbarMessage("Profile updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating profile:", error);

      // Show error message
      setSnackbarMessage("Failed to update profile. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      setSnackbarMessage("Please select an image file");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setUploading(true);

      // Create FormData object
      const formData = new FormData();
      formData.append("file", file);

      // Upload the image
      const response = await uploadAvatar(formData);

      // For demo purposes, create a local URL for the image
      const imageUrl = response.data.result.avatar;

      // Update user details with the new avatar URL
      setUserDetails({
        ...userDetails,
        avatar: imageUrl,
      });

      // Success message
      setSnackbarMessage("Avatar updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setSnackbarMessage("Failed to upload avatar. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      getUserDetails();
    }
  }, [navigate]);

  return (
    <Scene>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {userDetails ? (
        <Card
          sx={{
            minWidth: 350,
            maxWidth: 500,
            boxShadow: 3,
            borderRadius: 2,
            padding: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%",
              gap: "10px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                gap: "20px",
                mb: "30px",
              }}
            >
              <Tooltip title="Click to upload a profile picture">
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={userDetails.avatar}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: 48,
                      bgcolor: "#1976d2",
                      cursor: "pointer",
                      transition: "opacity 0.3s",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                    onClick={handleAvatarClick}
                  >
                    {userDetails.firstName?.[0]}
                    {userDetails.lastName?.[0]}
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.3s",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      "&:hover": {
                        opacity: 1,
                      },
                      cursor: "pointer",
                    }}
                    onClick={handleAvatarClick}
                  >
                    <PhotoCameraIcon sx={{ color: "white", fontSize: 36 }} />
                  </Box>
                  {uploading && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <CircularProgress size={36} sx={{ color: "white" }} />
                    </Box>
                  )}
                </Box>
              </Tooltip>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {userDetails.username}
              </Typography>
              <Divider sx={{ width: "100%", mb: "10px" }} />
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                mb: "20px",
              }}
            >
              Welcome back to Devteria, {userDetails.username} !
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                User Id
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                }}
              >
                {userDetails.id}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                First Name
              </Typography>
              <TextField
                size="small"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                sx={{ width: "60%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Last Name
              </Typography>
              <TextField
                size="small"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                sx={{ width: "60%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Email
              </Typography>
              <TextField
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ width: "60%" }}
                type="email"
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                City
              </Typography>
              <TextField
                size="small"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                sx={{ width: "60%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Date of birth
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dob}
                  onChange={(newValue) => setDob(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                  sx={{ width: "60%" }}
                />
              </LocalizationProvider>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                mt: 3,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdate}
                sx={{ px: 4 }}
              >
                Update Profile
              </Button>
            </Box>
          </Box>
        </Card>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress></CircularProgress>
          <Typography>Loading ...</Typography>
        </Box>
      )}
    </Scene>
  );
}
