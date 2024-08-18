import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CircularProgress, Typography } from "@mui/material";
import { getMyInfo } from "../services/userService";
import { isAuthenticated } from "../services/authenticationService";
import Scene from "./Scene";
import { logOut } from "../services/authenticationService";

export default function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({});

  const getUserDetails = async () => {
    try {
      const response = await getMyInfo();
      const data = response.data;

      setUserDetails(data.result);
    } catch (error) {
      if (error.response.status === 401) {
        logOut();
        navigate("/login");
      }
    }
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
            <Typography
              sx={{
                fontSize: 18,
                mb: "40px",
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
                width: "100%", // Ensure content takes full width
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
                alignItems: "flex-start",
                width: "100%", // Ensure content takes full width
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
              <Typography
                sx={{
                  fontSize: 14,
                }}
              >
                {userDetails.firstName}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%", // Ensure content takes full width
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
              <Typography
                sx={{
                  fontSize: 14,
                }}
              >
                {userDetails.lastName}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%", // Ensure content takes full width
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
              <Typography
                sx={{
                  fontSize: 14,
                }}
              >
                {userDetails.dob}
              </Typography>
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
