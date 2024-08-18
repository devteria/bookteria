import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CircularProgress, Typography } from "@mui/material";
import { isAuthenticated } from "../services/authenticationService";
import Scene from "./Scene";
import Post from "../components/Post";
import { getMyPosts } from "../services/postService";
import { logOut } from "../services/authenticationService";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const observer = useRef();
  const lastPostElementRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      loadPosts(page);
    }
  }, [navigate, page]);

  const loadPosts = (page) => {
    console.log(`loading posts for page ${page}`);
    setLoading(true);
    getMyPosts(page)
      .then((response) => {
        setTotalPages(response.data.result.totalPages);
        setPosts((prevPosts) => [...prevPosts, ...response.data.result.data]);
        setHasMore(response.data.result.data.length > 0);
        console.log("loaded posts:", response.data.result);
      })
      .catch((error) => {
        if (error.response.status === 401) {
          logOut();
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!hasMore) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (page < totalPages) {
          setPage((prevPage) => prevPage + 1);
        }
      }
    });
    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }

    setHasMore(false);
  }, [hasMore]);

  return (
    <Scene>
      <Card
        sx={{
          minWidth: 500,
          maxWidth: 600,
          boxShadow: 3,
          borderRadius: 2,
          padding: "20px",
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
              mb: "10px",
            }}
          >
            Your posts,
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%", // Ensure content takes full width
            }}
          ></Box>
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <Post ref={lastPostElementRef} key={post.id} post={post} />
              );
            } else {
              return <Post key={post.id} post={post} />;
            }
          })}
          {loading && (
            <Box
              sx={{ display: "flex", justifyContent: "center", width: "100%" }}
            >
              <CircularProgress size="24px" />
            </Box>
          )}
        </Box>
      </Card>
    </Scene>
  );
}
