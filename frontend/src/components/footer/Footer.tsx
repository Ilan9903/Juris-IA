import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer>
      <div
        style={{
          width: "100%",
          minHeight: "20vh",
          maxHeight: "30vh",
          marginTop: 200,
        }}
      >
        <p style={{ fontSize: "30px", textAlign: "center", padding: "20px" }}>
          Développé avec 💖 par
          <span>
            <Link
              style={{ color: "white" }}
              className="nav-link"
              to={"https://trello.com/b/Qu3qwj67/jurisia-innov-project-24-25"}
              target="_blank"
            >Ilan
            </Link>
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
