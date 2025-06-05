import TextField from "@mui/material/TextField";

type Props = {
  name: string;
  type: string;
  label: string;
};

const CustomizedInput = (props: Props) => {
  return (
    <TextField
      margin="normal"
      fullWidth // Ajouté pour prendre toute la largeur disponible
      InputLabelProps={{ style: { color: "white" } }}
      name={props.name}
      label={props.label}
      type={props.type}
      InputProps={{
        style: {
          // width: "400px", // ANCIEN: largeur fixe
          borderRadius: 10,
          fontSize: 20, // Peut-être réduire légèrement sur xs ?
          color: "white",
          backgroundColor: "#333",
        },
      }}
    // Pour contrôler la largeur maximale sur les grands écrans
    // tout en permettant au fullWidth de fonctionner sur les petits.
    // Ceci sera géré par le conteneur parent dans Login.tsx et Signup.tsx.
    />
  );
};

export default CustomizedInput;