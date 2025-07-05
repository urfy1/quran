// page6.js
import React, { useState, useEffect } from 'react';
import axios from "axios";
import { ChakraProvider, Box, Card, CardHeader, CardBody, Heading, Text, Stack, StackDivider, Button, Spinner, Center } from '@chakra-ui/react';
import { useLocation, Link as RouterLink } from "react-router-dom";
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown for rendering markdown

// Consider moving this to a separate utility file and importing it in both Page4 and Page6
const translationNames = {
    'en.asad': "Muhammad Asad",
    'en.pickthall': "Pickthall",
    'en.yusufali': "Yusuf Ali",
    'en.sahih': "Sahih International",
    'en.transliteration': "Transliteration",
    'ur.maududi': "Maududi (Urdu)",
    'fr.hamidullah': "Hamidullah (French)",
    'es.bornez': "Bornez (Spanish)",
    // Add other common translations if needed from the API
};

// Map for Tafsir author display names
const tafsirNames = {
    'Ibn Kathir': 'Ibn Kathir',
    'Maarif Ul Quran': 'Maarif Ul Quran',
    'Tazkirul Quran': 'Tazkirul Quran',
};

// Note: The tafsirIdentifiers object is not strictly needed for the quranapi.pages.dev endpoint
// as it returns all tafsirs by their 'author' name, which directly matches your tafsirNames keys.
// It was more relevant for the alquran.cloud API which uses different identifiers.
const tafsirIdentifiers = {
    'Ibn Kathir': 'en.ibn_kathir', // Example identifier for alquran.cloud
    'Maarif Ul Quran': 'en.maarif-ul-quran', // Example identifier for alquran.cloud
    'Tazkirul Quran': 'en.tazkirul-quran' // Example identifier for alquran.cloud
};

const Page6 = () => {
    const location = useLocation();
    const surahNumberFromLink = location.state?.surahNumber;
    const ayahNumberFromLink = location.state?.ayahNumber;
    const selectedAyahsData = location.state?.selectedAyahsData; // Used for bulk selection from Page4
    const surahInfoFromLink = location.state?.surahInfo; // Used for bulk selection from Page4

    const [surahDetails, setSurahDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get languages and selected Tafsirs from localStorage
    const LangType = JSON.parse(localStorage.getItem('Qlangs')) || ['en.asad'];
    const selectedTafsirs = JSON.parse(localStorage.getItem('Qtafsirs')) || ['Ibn Kathir']; // Default to Ibn Kathir

    useEffect(() => {
        if (selectedAyahsData && selectedAyahsData.length > 0) {
            // If selectedAyahsData is present, it means we came from "View Selected" (bulk mode from Page4)
            setSurahDetails(surahInfoFromLink); // Set surah info from the passed state
            setIsLoading(false);
            setError(null);
            // NOTE: For bulk selected ayahs, Tafsir is NOT fetched here.
            // The quranapi.pages.dev API is for single ayah lookups. If you need Tafsir for all
            // selected ayahs in bulk, you would need to modify Page4 to fetch Tafsirs for each
            // selected ayah before navigating, or implement individual fetches here, which could be slow.
        } else if (surahNumberFromLink) { // Otherwise, try to fetch a single surah/ayah
            setIsLoading(true);
            setError(null); // Clear previous errors

            // Fetch the surah with ALL current languages from localStorage for display on Page6
            const fetchPromises = LangType.map(lang =>
                axios.get(`http://api.alquran.cloud/v1/surah/${surahNumberFromLink}/${lang}`)
            );

            // Also fetch the Arabic text explicitly using a reliable Arabic edition
            const arabicFetchPromise = axios.get(`http://api.alquran.cloud/v1/surah/${surahNumberFromLink}/quran-simple`);

            // NEW: Add Tafsir fetch promise if a specific ayah is targeted AND selectedTafsirs are chosen
            // This is the endpoint you specified: /api/tafsir/<surahNo>_<ayahNo>.json
            const tafsirPromises = [];
            if (ayahNumberFromLink && selectedTafsirs.length > 0) {
                tafsirPromises.push(
                    axios.get(`https://quranapi.pages.dev/api/tafsir/${surahNumberFromLink}_${ayahNumberFromLink}.json`)
                );
            }

            Promise.all([arabicFetchPromise, ...fetchPromises, ...tafsirPromises])
                .then((responses) => {
                    const arabicSurahData = responses[0].data.data;
                    // Determine the slice for translation responses based on whether tafsirPromises were made
                    const translationResponses = responses.slice(1, responses.length - tafsirPromises.length);
                    // Get the Tafsir response if it was part of the promises
                    const tafsirResponseData = tafsirPromises.length > 0 ? responses[responses.length - 1].data : null;

                    const ayahsWithTranslations = arabicSurahData.ayahs.map((ayah, idx) => {
                        const translations = translationResponses.map(res => ({
                            lang: res.config.url.split('/').pop(),
                            text: res.data.data.ayahs[idx].text
                        }));

                        // NEW: Add Tafsirs for the specific ayah if available and if this is the target ayah
                        let ayahsTafsirs = [];
                        // Check if tafsir data was fetched AND if this is the specific ayah we're looking for Tafsir for
                        if (tafsirResponseData && ayah.numberInSurah === ayahNumberFromLink) {
                            // Filter tafsirs based on user's selection in localStorage (selectedTafsirs)
                            ayahsTafsirs = tafsirResponseData.tafsirs.filter(tafsir =>
                                selectedTafsirs.includes(tafsir.author)
                            );
                        }

                        return {
                            ...ayah,
                            translations,
                            tafsirs: ayahsTafsirs // Add tafsirs to the ayah object
                        };
                    });

                    setSurahDetails({ ...arabicSurahData, ayahs: ayahsWithTranslations });
                    console.log('Surah details for Page6 (single ayah mode):', { ...arabicSurahData, ayahs: ayahsWithTranslations });

                    // Scroll to the specific ayah if provided
                    if (ayahNumberFromLink) {
                        setTimeout(() => { // Give time for content to render
                            const ayahElement = document.getElementById(`ayah-${ayahNumberFromLink}`);
                            if (ayahElement) {
                                ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                    }
                })
                .catch((err) => {
                    console.error('Error fetching data for Page6:', err);
                    setError("Failed to load surah details or tafsirs. Please try again or go back.");
                    setSurahDetails(null); // Clear data on error
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setError("No surah or selected ayahs provided. Please go back to the Surah list.");
            setIsLoading(false);
            setSurahDetails(null);
        }
    }, [surahNumberFromLink, LangType, ayahNumberFromLink, selectedAyahsData, surahInfoFromLink, selectedTafsirs]); // Add selectedTafsirs to dependency array

    return (
        <ChakraProvider>
            <Box p={4} maxW="container.xl" mx="auto">
                <Card align="center" width="full" mb={6}>
                    <Stack direction='row' spacing={6} my={4}>
                        <RouterLink to="/Page4">
                            <Button colorScheme='green' variant='solid'>Back to Surah List</Button>
                        </RouterLink>
                        {surahDetails && !selectedAyahsData && ( // Only show if not in bulk mode
                            <Button colorScheme='blue' variant='outline'>
                                Surah: {surahDetails.englishName} ({surahDetails.number})
                            </Button>
                        )}
                        {selectedAyahsData && (
                            <Heading size='md' align="center" color='purple.600'>
                                Selected Ayahs from {surahInfoFromLink?.englishName || "Current Surah"}
                            </Heading>
                        )}
                    </Stack>

                    <CardHeader>
                        <Heading size='md' align="center" color='green'>
                            {surahDetails && !selectedAyahsData ? `${surahDetails.englishName} (${surahDetails.name})` : 'Ayah Details'}
                        </Heading>
                        {surahDetails && !selectedAyahsData && (
                            <Text fontSize="sm" color="gray.600" mt={1}>
                                Revelation Type: {surahDetails.revelationType}, Ayahs: {surahDetails.numberOfAyahs}
                            </Text>
                        )}
                    </CardHeader>
                </Card>

                {isLoading ? (
                    <Center py={10}>
                        <Spinner size="xl" color="brand.500" thickness="4px" />
                        <Text ml={4} fontSize="lg">Loading Ayahs...</Text>
                    </Center>
                ) : error ? (
                    <Text color="red.500" textAlign="center" fontSize="lg">{error}</Text>
                ) : (
                    <Stack spacing={4} divider={<StackDivider borderColor="gray.200" />}>
                        {selectedAyahsData && selectedAyahsData.length > 0 ? (
                            // Display multiple selected ayahs (from Page4 bulk selection)
                            selectedAyahsData.map((ayah, index) => (
                                <Box key={ayah.number} p={4} borderWidth="1px" borderRadius="lg" bg="white">
                                    <Heading size="sm" mb={2}>Ayah {ayah.numberInSurah}</Heading>
                                    <Text
                                        fontSize="2xl" // Adjust font size as needed
                                        textAlign="right"
                                        dir="rtl"
                                        fontFamily="Amiri, serif"
                                        lineHeight="2"
                                        letterSpacing="1px"
                                        mb={3}
                                        color="quran.darkGreen"
                                    >
                                        {ayah.text}
                                    </Text>
                                    {ayah.translations.map((trans, transIdx) => (
                                        <Box key={transIdx} mb={2}>
                                            <Text fontWeight="semibold" fontSize="md" color="blue.700">
                                                {translationNames[trans.lang] || trans.lang}:
                                            </Text>
                                            <Text fontSize="md" color="gray.800">{trans.text}</Text>
                                        </Box>
                                    ))}
                                    {/*
                                        NOTE: Tafsir data is fetched only for single ayah view.
                                        If you want Tafsir for all selectedAyahsData, you would need to
                                        modify Page4 to fetch individual Tafsirs for each selected ayah
                                        before passing the data to Page6. This can be API-intensive.
                                    */}
                                </Box> 
                            ))
                        ) : surahDetails && surahDetails.ayahs && surahDetails.ayahs.length > 0 ? (
                            // Display single ayah details or full surah if no specific ayah
                            surahDetails.ayahs.map((ayah) => (
                                <Card key={ayah.numberInSurah} id={`ayah-${ayah.numberInSurah}`} mb={4}>
                                    <CardHeader>
                                        <Heading size='md'>Ayah {ayah.numberInSurah}</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <Stack divider={<StackDivider />} spacing='4'>
                                            <Box>
                                                <Heading size='xs' textTransform='uppercase'>
                                                    Arabic Text
                                                </Heading>
                                                <Text pt='2' fontSize='2xl' textAlign="right" dir="rtl" fontFamily="Amiri, serif" lineHeight="2" letterSpacing="1px">
                                                    {ayah.text}
                                                </Text>
                                            </Box>
                                            {ayah.translations.map((trans, idx) => (
                                                <Box key={idx}>
                                                    <Heading size='xs' textTransform='uppercase'>
                                                        {translationNames[trans.lang] || trans.lang}
                                                    </Heading>
                                                    <Text pt='2' fontSize='md'>
                                                        {trans.text}
                                                    </Text>
                                                </Box>
                                            ))}
                                            {/* NEW: Display Tafsirs for the specific ayah */}
                                            {ayah.tafsirs && ayah.tafsirs.length > 0 && ayah.numberInSurah === ayahNumberFromLink && (
                                                <Box> {/* Wrap tafsirs in a single box for better grouping */}
                                                    <Heading size='xs' textTransform='uppercase' mb={2} color="purple.700">
                                                        Tafsirs
                                                    </Heading>
                                                    {ayah.tafsirs.map((tafsir, tafsirIdx) => (
                                                        <Box key={tafsirIdx} mt={2} p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.100">
                                                            <Text fontWeight="semibold" fontSize="md" color="purple.800" mb={1}>
                                                                {tafsirNames[tafsir.author] || tafsir.author}
                                                            </Text>
                                                            {tafsir.groupVerse && <Text fontSize="sm" color="gray.600" mb={2}>{tafsir.groupVerse}</Text>}
                                                            {/* Use ReactMarkdown to render the markdown content */}
                                                            <ReactMarkdown>{tafsir.content}</ReactMarkdown>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Stack>
                                    </CardBody>
                                </Card>
                            ))
                        ) : (
                            <Center py={10}>
                                <Text>No ayahs to display.</Text>
                            </Center>
                        )}
                    </Stack>
                )}
            </Box>
        </ChakraProvider>
    );
};

export default Page6;
