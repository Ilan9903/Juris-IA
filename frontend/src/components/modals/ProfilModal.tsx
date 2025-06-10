import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Avatar,
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import toast from "react-hot-toast";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/useAuth";

const modalStyle = {
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "#0b1929",
    borderRadius: 3,
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 }, // Padding responsif
    width: { xs: "80%", sm: "60%", md: "auto" }, // Largeur responsive
    minWidth: { md: 320 }, // Garder une largeur minimale sur desktop
    maxWidth: { xs: "calc(100% - 32px)", sm: 400, md: 400 }, // Limiter la largeur max
    color: "white",
    outline: "none",
    maxHeight: "90vh", // Empêcher le modal d'être trop haut
    overflowY: "auto",  // Permettre le scroll interne si le contenu est trop grand
};

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Impossible d'obtenir le contexte 2D");

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) reject(new Error("Canvas est vide"));
            else resolve(blob);
        }, "image/png");
    });
}

const ProfileModal = () => {
    const { isProfileModalOpen, closeProfileModal, navigateToSettings } = useUI();
    const { user, updateUser } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"online" | "idle" | "offline">("offline");

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState("/pdp_none.png");
    const [canEditEmail, setCanEditEmail] = useState(false);

    const [croppingMode, setCroppingMode] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // NOUVEL ÉTAT POUR LA CONFIRMATION DE MOT DE PASSE
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState(""); // Pour stocker le mot de passe entré

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            setStatus((user.status as "online" | "idle" | "offline") || "offline");
            setPreview(user.profileImage || "/pdp_none.png");
        }
    }, [user]);

    useEffect(() => {
        if (!isProfileModalOpen) {
            setImage(null);
            setCroppingMode(false);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setCanEditEmail(false);
            // Réinitialiser les états de la confirmation de mot de passe
            setShowPasswordConfirm(false);
            setPasswordConfirm("");
        }
    }, [isProfileModalOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setCroppingMode(true);
        }
    };

    const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const applyCrop = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImg(preview, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], image?.name || "cropped.png", {
                type: croppedBlob.type,
            });
            setImage(croppedFile);
            setPreview(URL.createObjectURL(croppedBlob));
            setCroppingMode(false);
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors du recadrage de l'image");
        }
    };

    const cancelCrop = () => {
        setCroppingMode(false);
        setImage(null);
        setPreview(user?.profileImage || "/pdp_none.png");
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", name);
        formData.append("status", status);
        if (image) formData.append("profile", image);
        if (canEditEmail) formData.append("email", email); // Seulement si l'édition est autorisée

        try {
            const res = await axios.put("/user/updateprofile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            updateUser(res.data.user);
            toast.success("Succès : Profil mis à jour !");
            closeProfileModal();
        } catch (err) {
            console.error(err);
            toast.error("Erreur : Mise à jour du profil.");
        }
    };

    // LOGIQUE DE CONFIRMATION DE MOT DE PASSE MISE À JOUR
    const handlePasswordConfirmSubmit = async () => {
        if (!passwordConfirm) {
            toast.error("Veuillez entrer votre mot de passe.");
            return;
        }

        try {
            toast.loading("Vérification du mot de passe...", { id: "pwdConfirm" });
            await axios.post("/user/verify-password", { password: passwordConfirm });
            setCanEditEmail(true);
            setShowPasswordConfirm(false); // Cache la sous-modal
            setPasswordConfirm(""); // Réinitialise le champ de mot de passe
            toast.success("Mot de passe confirmé. Vous pouvez modifier l'email.", { id: "pwdConfirm" });
        } catch (err) {
            console.error(err);
            toast.error("Mot de passe incorrect.", { id: "pwdConfirm" });
        }
    };

    const handleCancelPasswordConfirm = () => {
        setShowPasswordConfirm(false);
        setPasswordConfirm(""); // Réinitialise le champ de mot de passe
    };

    return (
        <Modal open={isProfileModalOpen} onClose={closeProfileModal}>
            <Box component="form" sx={modalStyle} onSubmit={handleSubmit}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">Profil Utilisateur 🪪</Typography>
                    <Box>
                        <Tooltip title="Paramètres">
                            <IconButton onClick={navigateToSettings} sx={{ color: "white", marginRight: 1 }}>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton onClick={closeProfileModal} sx={{ color: "white" }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>

                {croppingMode ? (
                    // Section de recadrage d'image
                    <>
                        <Box
                            sx={{
                                position: "relative",
                                width: 320,
                                height: 320,
                                bgcolor: "#222",
                                mb: 2,
                                borderRadius: 3,
                            }}
                        >
                            <Cropper
                                image={preview}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                            <Button variant="outlined" onClick={cancelCrop}>Annuler</Button>
                            <Button variant="contained" onClick={applyCrop} sx={{ backgroundColor: "#03a3c2", color: "black" }}>
                                Appliquer
                            </Button>
                        </Box>
                    </>
                ) : showPasswordConfirm ? (
                    // NOUVELLE SECTION : Confirmation du mot de passe
                    <Box sx={{ mt: 2, mb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="body1">Confirme ton mot de passe pour modifier l'email :</Typography>
                        <TextField
                            fullWidth
                            autoFocus
                            label="Mot de passe"
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            InputProps={{ style: { color: "white" } }}
                            InputLabelProps={{ style: { color: "white" } }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    backgroundColor: "transparent", // Fond de l'input
                                    borderRadius: 1,
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                            }}
                        />
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                            <Button variant="outlined" onClick={handleCancelPasswordConfirm} sx={{ color: "white", borderColor: "white" }}>Annuler</Button>
                            <Button variant="contained" onClick={handlePasswordConfirmSubmit} sx={{ backgroundColor: "#03a3c2", color: "black" }}>
                                Confirmer
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    // Section principale du profil
                    <>
                        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                            <Box
                                sx={{
                                    position: "relative",
                                    width: 80,
                                    height: 80,
                                    cursor: "pointer",
                                    "&:hover .edit-overlay": {
                                        opacity: 1,
                                        transform: "scale(1)",
                                    },
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar
                                    src={preview}
                                    sx={{ width: 80, height: 80, border: "2px solid #03a3c2" }}
                                    className={preview === "/pdp_none.png" ? "image-inverted" : ""}
                                />
                                <Box
                                    className={
                                        "edit-overlay"
                                        // (preview === "/pdp_none.png" ? " image-inverted" : "")
                                    }
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        bgcolor: "rgba(0, 0, 0, 0.5)",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: 0,
                                        transform: "scale(0.9)",
                                        transition: "opacity 0.3s ease, transform 0.3s ease",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <EditIcon sx={{ color: "#03a3c2", fontSize: 28 }} />
                                </Box>
                            </Box>
                            <input hidden ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
                        </Box>

                        <TextField
                            fullWidth
                            label="Nom"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            InputProps={{ style: { color: "white" } }}
                            InputLabelProps={{ style: { color: "white" } }}
                            sx={{
                                mb: 2,
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "white !important",
                                    opacity: 1,
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "& .MuiInputLabel-root.Mui-disabled": {
                                    color: "white !important",
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            autoFocus
                            label="Email"
                            value={email}
                            disabled={!canEditEmail}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{ style: { color: "white" } }}
                            InputLabelProps={{ style: { color: "white" } }}
                            sx={{
                                mb: 2,
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "white !important",
                                    opacity: 1,
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "white",
                                },
                                "& .MuiInputLabel-root.Mui-disabled": {
                                    color: "white !important",
                                },
                            }}
                        />

                        {!canEditEmail && (
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowPasswordConfirm(true)}
                                    sx={{ color: "white", borderColor: "white" }}
                                >
                                    Modifier l'email
                                </Button>
                            </Box>
                        )}

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="status-label">Statut</InputLabel>
                            <Select
                                labelId="status-label"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as "online" | "idle" | "offline")}
                                label="Statut"
                                sx={{
                                    backgroundColor: "transparent",
                                    color: "white",
                                    ".MuiSelect-icon": { color: "white" },
                                    ".MuiOutlinedInput-notchedOutline": { color: "white", borderColor: "white" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { color: "white", borderColor: "white" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { color: "white", borderColor: "white" },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: "rgb(17,29,39)",
                                            color: "white",
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="online">🟢 En ligne</MenuItem>
                                <MenuItem value="idle">🟠 Inactif</MenuItem>
                                <MenuItem value="offline">⚫ Hors ligne</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            <Button variant="outlined" onClick={closeProfileModal} sx={{ color: "white", borderColor: "white" }}>Annuler</Button>
                            <Button type="submit" variant="contained" sx={{ backgroundColor: "#03a3c2", color: "black" }}>
                                Sauvegarder
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>
    );
};

export default ProfileModal;