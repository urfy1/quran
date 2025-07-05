import React, { useState, useEffect } from 'react';
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Stack,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Input, // Added for search/filter
  FormControl,
  FormLabel,
  Badge
} from '@chakra-ui/react';
import { FaLanguage } from 'react-icons/fa'; // Added for better UI

// Updated Page5 component
const Page5 = ({ currentLanguages, setCurrentLanguages }) => {
  const [allTranslations, setAllTranslations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get("http://api.alquran.cloud/v1/edition");
        // Filter for "translation" types and optionally "quran" format
        const filteredTranslations = response.data.data.filter(
          (edition) => edition.type === 'translation' && edition.format === 'text'
        );
        setAllTranslations(filteredTranslations);
      } catch (err) {
        console.error("Error fetching translations:", err);
        setError("Failed to load translation options. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, []);

  const handleLanguageToggle = (identifier) => {
    let updatedLanguages;
    if (currentLanguages.includes(identifier)) {
      updatedLanguages = currentLanguages.filter(lang => lang !== identifier);
    } else {
      updatedLanguages = [...currentLanguages, identifier];
    }
    setCurrentLanguages(updatedLanguages); // Update state in Page4
    localStorage.setItem('Qlangs', JSON.stringify(updatedLanguages)); // Save to localStorage
  };

  const filteredTranslations = allTranslations.filter(translation =>
    translation.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    translation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    translation.identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Heading size="md" mb={4} display="flex" alignItems="center">
        <FaLanguage style={{ marginRight: '8px' }} />
        Select Translations
      </Heading>

      <FormControl mb={4}>
        <FormLabel htmlFor="translation-search">Search Translations</FormLabel>
        <Input
          id="translation-search"
          placeholder="Search by name or identifier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          mb={2}
        />
      </FormControl>

      {isLoading && (
        <Stack align="center" py={4}>
          <Spinner size="md" />
          <Text>Loading translations...</Text>
        </Stack>
      )}

      {error && (
        <Alert status="error" mt={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!isLoading && !error && (
        <CheckboxGroup colorScheme="blue" value={currentLanguages}>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 2 }} spacing={2}>
            {filteredTranslations.length === 0 && searchTerm ? (
              <Text colSpan={2} color="gray.500">No matching translations found.</Text>
            ) : (
              filteredTranslations.map((translation) => (
                <Checkbox
                  key={translation.identifier}
                  value={translation.identifier}
                  isChecked={currentLanguages.includes(translation.identifier)}
                  onChange={() => handleLanguageToggle(translation.identifier)}
                >
                  <Text fontSize="sm">
                    {translation.englishName}
                    <Badge ml={1} colorScheme="purple" variant="outline">{translation.language}</Badge>
                    <Text as="span" fontSize="xs" color="gray.500" ml={1}>({translation.identifier})</Text>
                  </Text>
                </Checkbox>
              ))
            )}
             {allTranslations.length > 0 && !searchTerm && ( // Show default if no search
              allTranslations.filter(t => !currentLanguages.includes(t.identifier)).length === 0 && (
                <Text colSpan={2} color="gray.500">All available translations are selected or no more translations found after filtering.</Text>
              )
            )}
          </SimpleGrid>
        </CheckboxGroup>
      )}
    </Box>
  );
};

export default Page5;