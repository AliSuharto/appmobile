import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Note } from "../../core/repositories/noteRepository";
import { noteService } from "../../core/services/noteService";

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  noteToEdit?: Note | null;
}

export default function NoteModal({
  visible,
  onClose,
  onSave,
  noteToEdit,
}: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content || "");
        // Focus sur le contenu en mode édition
        setTimeout(() => {
          contentInputRef.current?.focus();
        }, 100);
      } else {
        setTitle("");
        setContent("");
        // Focus sur le titre en mode création
        setTimeout(() => {
          titleInputRef.current?.focus();
        }, 100);
      }
    }
  }, [visible, noteToEdit]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Attention", "Veuillez saisir un titre");
      return;
    }

    setIsSaving(true);

    let success = false;
    if (noteToEdit) {
      // Mode édition
      success = await noteService.updateNote(noteToEdit.id, { title, content });
    } else {
      // Mode création
      const noteId = await noteService.createNote(title, content);
      success = noteId !== null;
    }

    setIsSaving(false);

    if (success) {
      onSave();
      onClose();
    }
  };

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        "Quitter sans enregistrer ?",
        "Vos modifications seront perdues",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Quitter",
            style: "destructive",
            onPress: onClose,
          },
        ],
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {noteToEdit ? "Modifier la note" : "Nouvelle note"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "En cours..." : "Enregistrer"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Titre */}
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            placeholder="Titre"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Contenu */}
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Contenu de la note..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#999"
          />

          {/* Info date pour l'édition */}
          {noteToEdit && (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color="#999" />
                <Text style={styles.infoText}>
                  Créé le{" "}
                  {new Date(noteToEdit.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="create-outline" size={14} color="#999" />
                <Text style={styles.infoText}>
                  Modifié le{" "}
                  {new Date(noteToEdit.updated_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e81010ff",
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    paddingVertical: 8,
  },
  contentInput: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    minHeight: 200,
  },
  infoContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 6,
  },
});
