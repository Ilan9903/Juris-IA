// backend_src/utils/validators.ts
import { NextFunction, Request, Response } from "express";
import { body, query, ValidationChain, validationResult } from "express-validator"; // Ajoutez 'query'

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        // Vous pouvez choisir de vous arrêter à la première erreur ou de toutes les accumuler.
        // Pour les paramètres de requête, il est souvent utile de toutes les accumuler.
        // La ligne 'break' actuelle s'arrête à la première. Retirez-la si vous voulez toutes les erreurs.
        // break; // Optionnel: commentez pour voir toutes les erreurs de validation à la fois
      }
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    // Log des erreurs de validation côté serveur pour le débogage
    console.error(`[${new Date().toISOString()}] --- Erreurs de validation API:`, JSON.stringify(errors.array()));
    return res.status(422).json({ errors: errors.array() });
  };
};

export const loginValidator = [ //
  body("email").trim().isEmail().withMessage("Email is required"), //
  body("password") //
    .trim() //
    .isLength({ min: 6 }) //
    .withMessage("Password should contain atleast 6 characters"), //
];

export const signupValidator = [ //
  body("name").notEmpty().withMessage("Name is required"), //
  ...loginValidator, //
];

export const chatCompletionValidator = [ //
  body("message").notEmpty().withMessage("Message  is required"), //
];

// NOUVEAUX VALIDATEURS POUR LES ARTICLES
export const getArticlesValidator = [
  query('page')
    .optional() // 'page' est optionnel
    .isInt({ min: 1 }) // Doit être un entier supérieur ou égal à 1
    .withMessage('Le numéro de page doit être un entier positif.')
    .toInt(), // Convertit en entier
  query('limit')
    .optional() // 'limit' est optionnel
    .isInt({ min: 1 }) // Doit être un entier supérieur ou égal à 1
    .withMessage('La limite doit être un entier positif.')
    .toInt(), // Convertit en entier
  query('category')
    .optional() // 'category' est optionnel
    .isString() // Doit être une chaîne
    .trim() // Enlève les espaces
    .escape() // Échappe les caractères HTML pour la sécurité
    .withMessage('La catégorie doit être une chaîne de caractères.'),
  query('search')
    .optional() // 'search' est optionnel
    .isString() // Doit être une chaîne
    .trim() // Enlève les espaces
    .escape() // Échappe les caractères HTML
    .withMessage('Le terme de recherche doit être une chaîne de caractères.')
];