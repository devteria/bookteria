import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Popover,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { search as searchUsers } from "../services/userService";

const NewChatPopover = ({ anchorEl, open, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  // Memoized search function to avoid recreating on every render
  const handleSearch = useCallback(async (query) => {
    if (!query?.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await searchUsers(query.trim());
      if (response?.data?.result) {
        setSearchResults(response.data.result);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setHasSearched(false);
        setError(null);
      }
    }, 500); // 500ms debounce time

    // Cleanup function to clear timeout if component unmounts or query changes
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);
  // No need for handleKeyPress anymore as search is debounced
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleUserSelect = (user) => {
    onSelectUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            p: 2,
            mt: 1,
          },
        },
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
        Start a new conversation
      </Typography>{" "}
      <TextField
        fullWidth
        placeholder="Start typing to search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClearSearch}
                aria-label="clear search"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        autoFocus
      />{" "}
      <Box sx={{ height: 300, overflow: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && searchResults.length > 0 && (
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                onClick={() => handleUserSelect(user)}
                sx={{
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar || ""} alt={user.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={user.firstName + " " + user.lastName}
                  primaryTypographyProps={{
                    fontWeight: "medium",
                    variant: "body1",
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {!loading && !error && searchResults.length === 0 && hasSearched && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography color="text.secondary">
              No users found matching "{searchQuery}"
            </Typography>
          </Box>
        )}

        {!loading && !error && !hasSearched && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography color="text.secondary">
              Search for a user to start a conversation
            </Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

NewChatPopover.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectUser: PropTypes.func.isRequired,
};

export default NewChatPopover;
