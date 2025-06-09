import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
const Logo = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
      }}
    >
      <Link to={"/"}>
        <img
          src="logo.png"
          alt="jurisialogo"
          width={"60px"}
          height={"60px"}
        />
      </Link>{" "}
      <Typography
        sx={{
          display: { md: "block", sm: "none", xs: "none" },
          mr: "auto",
          fontWeight: "800",
          textShadow: "2px 2px 20px #000",
        }}
      >
        <span style={{ fontSize: "30px" }}>Juris</span> IA
      </Typography>
    </div>
  );
};

export default Logo;
