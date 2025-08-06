// page6.js
import React, { useState, useEffect } from 'react';
import axios from "axios";
import {
  // Removed ChakraProvider from here
  Box, Card, CardHeader, CardBody, Heading, Text, Stack, StackDivider, Button, Spinner, Center, Input,
  useColorModeValue // Import useColorModeValue
} from '@chakra-ui/react';
import { useLocation, Link as RouterLink } from "react-router-dom";
import ReactMarkdown from 'react-markdown';

const translationNames = {
    'en.asad': "Muhammad Asad",
    'en.pickthall': "Pickthall",
    'en.yusufali': "Yusuf Ali",
    'en.sahih': "Sahih International",
    'en.transliteration': "Transliteration",
    'ur.maududi': "Maududi (Urdu)",
    'fr.hamidullah': "Hamidullah (French)",
    'es.bornez': "Bornez (Spanish)",
};

const tafsirNames = {
    'Ibn Kathir': 'Ibn Kathir',
    'Maarif Ul Quran': 'Maarif Ul Quran',
    'Tazkirul Quran': 'Tazkirul Quran',
};

const Page6 = () => {
    const location = useLocation();
    const surahNumberFromLink = location.state?.surahNumber;
    const ayahNumberFromLink = location.state?.ayahNumber;
    const selectedAyahsData = location.state?.selectedAyahsData;
    const surahInfoFromLink = location.state?.surahInfo;

    const [surahDetails, setSurahDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const LangType = JSON.parse(localStorage.getItem('Qlangs')) || ['en.asad'];
    const selectedTafsirs = JSON.parse(localStorage.getItem('Qtafsirs')) || ['Ibn Kathir'];

    // Theme-aware colors
    const cardBg = useColorModeValue('white', 'gray.700');
    const cardHeaderBg = useColorModeValue('gray.50', 'gray.800');
    const headingColor = useColorModeValue('green.600', 'green.200');
    const textColor = useColorModeValue('gray.600', 'gray.300');
    const arabicTextColor = useColorModeValue('quran.darkGreen', 'quran.gold');
    const dividerColor = useColorModeValue('gray.200', 'gray.600');
    const purpleBg = useColorModeValue('purple.50', 'purple.900');
    const purpleBorder = useColorModeValue('purple.100', 'purple.700');
    const purpleText = useColorModeValue('purple.800', 'purple.200');
    const blueText = useColorModeValue('blue.700', 'blue.300');

    useEffect(() => {
        if (selectedAyahsData && selectedAyahsData.length > 0) {
            setSurahDetails(surahInfoFromLink);
            setIsLoading(false);
            setError(null);
        } else if (surahNumberFromLink) {
            setIsLoading(true);
            setError(null);

            const fetchPromises = LangType.map(lang =>
                axios.get(`http://api.alquran.cloud/v1/surah/${surahNumberFromLink}/${lang}`)
            );

            const arabicFetchPromise = axios.get(`http://api.alquran.cloud/v1/surah/${surahNumberFromLink}/quran-simple`);

            const tafsirPromises = [];
            if (ayahNumberFromLink && selectedTafsirs.length > 0) {
                tafsirPromises.push(
                    axios.get(`https://quranapi.pages.dev/api/tafsir/${surahNumberFromLink}_${ayahNumberFromLink}.json`)
                );
            }

            Promise.all([arabicFetchPromise, ...fetchPromises, ...tafsirPromises])
                .then((responses) => {
                    const arabicSurahData = responses[0].data.data;
                    const translationResponses = responses.slice(1, responses.length - tafsirPromises.length);
                    const tafsirResponseData = tafsirPromises.length > 0 ? responses[responses.length - 1].data : null;

                    const ayahsWithTranslations = arabicSurahData.ayahs.map((ayah, idx) => {
                        const translations = translationResponses.map(res => ({
                            lang: res.config.url.split('/').pop(),
                            text: res.data.data.ayahs[idx].text
                        }));

                        let ayahsTafsirs = [];
                        if (tafsirResponseData && ayah.numberInSurah === ayahNumberFromLink) {
                            ayahsTafsirs = tafsirResponseData.tafsirs.filter(tafsir =>
                                selectedTafsirs.includes(tafsir.author)
                            );
                        }

                        return {
                            ...ayah,
                            translations,
                            tafsirs: ayahsTafsirs
                        };
                    });

                    setSurahDetails({ ...arabicSurahData, ayahs: ayahsWithTranslations });
                    console.log('Surah details for Page6 (single ayah mode):', { ...arabicSurahData, ayahs: ayahsWithTranslations });

                    if (ayahNumberFromLink) {
                        setTimeout(() => {
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
                    setSurahDetails(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setError("No surah or selected ayahs provided. Please go back to the Surah list.");
            setIsLoading(false);
            setSurahDetails(null);
        }
    }, [surahNumberFromLink, LangType, ayahNumberFromLink, selectedAyahsData, surahInfoFromLink, selectedTafsirs]);

    return (
        // Removed ChakraProvider from here
        <Box p={4} maxW="container.xl" mx="auto">
            <Card align="center" width="full" mb={6} bg={cardBg}>
                <Stack direction='row' spacing={6} my={4}>
                    <RouterLink to="/Page4">
                        <Button colorScheme='green' variant='solid'>Back to Surah List</Button>
                    </RouterLink>
                    {surahDetails && !selectedAyahsData && (
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

                <CardHeader bg={cardHeaderBg}> {/* Use theme-aware background for card header */}
                    <Heading size='md' align="center" color={headingColor}>
                        {surahDetails && !selectedAyahsData ? `${surahDetails.englishName} (${surahDetails.name})` : 'Ayah Details'}
                    </Heading>
                    {surahDetails && !selectedAyahsData && (
                        <Text fontSize="sm" color={textColor} mt={1}>
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
                <Stack spacing={4} divider={<StackDivider borderColor={dividerColor} />}> {/* Use theme-aware divider color */}
                    {selectedAyahsData && selectedAyahsData.length > 0 ? (
                        selectedAyahsData.map((ayah, index) => (
                            <Box key={ayah.number} p={4} borderWidth="1px" borderRadius="lg" bg={cardBg}>
                                <Heading size="sm" mb={2}>Ayah {ayah.numberInSurah}</Heading>
                                <Text
                                    fontSize="2xl"
                                    textAlign="right"
                                    dir="rtl"
                                    fontFamily="Amiri, serif"
                                    lineHeight="2"
                                    letterSpacing="1px"
                                    mb={3}
                                    color={arabicTextColor}
                                >
                                    {ayah.text}
                                </Text>
                                {ayah.translations.map((trans, transIdx) => (
                                    <Box key={transIdx} mb={2}>
                                        <Text fontWeight="semibold" fontSize="md" color={blueText}>
                                            {translationNames[trans.lang] || trans.lang}:
                                        </Text>
                                        <Text fontSize="md" color={textColor}>{trans.text}</Text>
                                    </Box>
                                ))}
                            </Box>
                        ))
                    ) : surahDetails && surahDetails.ayahs && surahDetails.ayahs.length > 0 ? (
                        surahDetails.ayahs.map((ayah) => (
                            <Card key={ayah.numberInSurah} id={`ayah-${ayah.numberInSurah}`} mb={4} bg={cardBg}>
                                <CardHeader bg={cardHeaderBg}>
                                    <Heading size='md'>Ayah {ayah.numberInSurah}</Heading>
                                </CardHeader>
                                <CardBody>
                                    <Stack divider={<StackDivider borderColor={dividerColor} />} spacing='4'>
                                        <Box>
                                            <Heading size='xs' textTransform='uppercase'>
                                                Arabic Text
                                            </Heading>
                                            <Text pt='2' fontSize='2xl' textAlign="right" dir="rtl" fontFamily="Amiri, serif" lineHeight="2" letterSpacing="1px" color={arabicTextColor}>
                                                {ayah.text}
                                            </Text>
                                        </Box>
                                        {ayah.translations.map((trans, idx) => (
                                            <Box key={idx}>
                                                <Heading size='xs' textTransform='uppercase'>
                                                    {translationNames[trans.lang] || trans.lang}
                                                </Heading>
                                                <Text pt='2' fontSize='md' color={textColor}>
                                                    {trans.text}
                                                </Text>
                                            </Box>
                                        ))}
                                        {ayah.tafsirs && ayah.tafsirs.length > 0 && ayah.numberInSurah === ayahNumberFromLink && (
                                            <Box>
                                                <Heading size='xs' textTransform='uppercase' mb={2} color={purpleText}>
                                                    Tafsirs
                                                </Heading>
                                                {ayah.tafsirs.map((tafsir, tafsirIdx) => (
                                                    <Box key={tafsirIdx} mt={2} p={3} bg={purpleBg} borderRadius="md" borderWidth="1px" borderColor={purpleBorder}>
                                                        <Text fontWeight="semibold" fontSize="md" color={purpleText} mb={1}>
                                                            {tafsirNames[tafsir.author] || tafsir.author}
                                                        </Text>
                                                        {tafsir.groupVerse && <Text fontSize="sm" color={textColor} mb={2}>{tafsir.groupVerse}</Text>}
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
    );
};

export default Page6;
