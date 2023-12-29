import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ModalUpload from "./ModalUpload";

interface iFile {
  seasons: number;
  episodes: number;
}

const extractContentName = (fileContent: string): string | null => {
  const matches = fileContent.match(/tvg-name="([^"]+)"/g);

  if (matches) {
    const names = matches.map((match) => {
      const nameWithoutSeasonEpisode = match
        .replace('tvg-name="', "")
        .replace('"', "");
      return nameWithoutSeasonEpisode.replace(/S\d{2} E\d{2}/, "").trim();
    });

    const nameCounts: { [key: string]: number } = {};

    for (const name of names) {
      if (nameCounts[name]) {
        nameCounts[name]++;
      } else {
        nameCounts[name] = 1;
      }
    }

    let mostCommonName = "";
    let highestCount = 0;

    for (const [name, count] of Object.entries(nameCounts)) {
      if (count > highestCount) {
        mostCommonName = name;
        highestCount = count;
      }
    }

    return mostCommonName;
  }

  return null;
};

const M3UReader: React.FC = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videosEnabled, setVideosEnabled] = useState<{
    [key: number]: boolean;
  }>({});
  const [contentName, setContentName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFullLines, setShowFullLines] = useState<{
    [key: number]: boolean;
  }>({});

  const [hasError, setHasError] = useState(false);
  const [errorsIndexState, setErrorsIndexState] = useState<number[]>([]);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [archiveInfo, setArchiveInfo] = useState<iFile | null>(null);
  const [actualErrorIndex, setActualErrorIndex] = useState<number>(-1);
  const isValidEntry = (episodeInfo: string, contentName: string) => {
    const regex = /S(\d+)E(\d+)/;
    const regexCorretFormat = /S(\d+) E(\d+)/;
    const hasInValidFormat = regex.test(episodeInfo);
    const hasValidFormat = regexCorretFormat.test(episodeInfo);
    const regexQuote = /'/g;
    const hasUnclosedQuote = regexQuote.test(contentName);
    const isInTvgName = episodeInfo.includes(`tvg-name="${contentName}`);
    const isInEndOfLine = episodeInfo.includes(`,${contentName}`);
    console.debug(
      !hasInValidFormat,
      isInTvgName,
      isInEndOfLine,
      hasValidFormat,
      !hasUnclosedQuote
    );
    return !hasInValidFormat &&
      isInTvgName &&
      isInEndOfLine &&
      hasValidFormat &&
      !hasUnclosedQuote
      ? true
      : {
          hasInValidFormat,
          isInTvgName,
          isInEndOfLine,
          hasValidFormat,
          hasUnclosedQuote,
        };
  };
  const testAllFile = (episodeInfo: string, contentName: string): boolean => {
    const regex = /S(\d+)E(\d+)/;
    const regexCorretFormat = /S(\d+) E(\d+)/;
    const hasInValidFormat = regex.test(episodeInfo);

    const hasValidFormat = regexCorretFormat.test(episodeInfo);
    const regexQuote = /'/g;
    const hasUnclosedQuote = regexQuote.test(contentName);
    const isInTvgName = episodeInfo.includes(`tvg-name="${contentName}`);
    const isInEndOfLine = episodeInfo.includes(`,${contentName}`);
    console.debug(
      !hasInValidFormat,
      isInTvgName,
      isInEndOfLine,
      hasValidFormat,
      "testAllFile"
    );

    return (
      !hasInValidFormat &&
      isInTvgName &&
      isInEndOfLine &&
      hasValidFormat &&
      !hasUnclosedQuote
    );
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    // Verificar a extensão do arquivo
    if (file && file.name.toLowerCase().endsWith(".m3u")) {
      setUploadedFile(file);
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const content = event.target.result as string;
          setFileContent(content);

          const extractedName = extractContentName(content);
          setContentName(extractedName);
          setCurrentPage(1);
          setVideosEnabled({});
          setShowFullLines({});
        }
      };

      reader.readAsText(file);
    } else {
      alert(
        "Formato de arquivo não suportado. Por favor, escolha um arquivo M3U."
      );
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const toggleVideo = (index: number) => {
    setVideosEnabled((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleShowFullLine = (index: number) => {
    setShowFullLines((prev) => {
      const updatedShowFullLines = { ...prev };

      Object.keys(updatedShowFullLines).forEach((key: any) => {
        updatedShowFullLines[key] = false;
      });

      updatedShowFullLines[index] = !prev[index];

      const adjustedIndex = index + (currentPage - 1) * itemsPerPage;
      const fullLine = !prev[index]
        ? fileContent?.split("#EXTINF:")[adjustedIndex + 1] || null
        : null;

      setSelectedLine(fullLine);

      return updatedShowFullLines;
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const slicedItems = fileContent
    ? fileContent
        .split("#EXTINF:")
        .slice(1)
        .slice(indexOfFirstItem, indexOfLastItem)
    : [];

  useEffect(() => {
    const slicedItems = fileContent
      ? fileContent.split("#EXTINF:").slice(1)
      : [];

    console.debug(slicedItems.length, "lengt");

    const errorsIndex: number[] = [];
    const result = slicedItems.filter((episode, index) => {
      const fullLine = `#EXTINF:${episode}`;
      if (!testAllFile(fullLine, contentName || "")) {
        errorsIndex.push(index);
      }
      return !testAllFile(fullLine, contentName || "");
    });

    setErrorsIndexState(errorsIndex);
    setHasError(result.length > 0 ? true : false);
    //console.log(result, "haserror");

    const getSeasonAndEpisodeCounts = (): {
      seasons: number;
      episodes: number;
    } => {
      const episodesInfo = slicedItems.map((episode) => {
        const lines = episode.split("\n").filter((line) => line.trim() !== "");
        return lines[0].trim();
      });

      const episodesCount: { [key: string]: number } = {};

      episodesInfo.forEach((episodeInfo) => {
        const match = episodeInfo.match(/S(\d+)\s*E(\d+)/);

        if (match) {
          const season = parseInt(match[1], 10);
          const episodeNumber = parseInt(match[2], 10);

          const episodeKey = `S${season}E${episodeNumber}`;

          if (episodesCount[episodeKey]) {
            episodesCount[episodeKey]++;
          } else {
            episodesCount[episodeKey] = 1;
          }
        }
      });

      const uniqueEpisodes = Object.keys(episodesCount);

      const seasons = new Set<number>();
      uniqueEpisodes.forEach((episodeKey) => {
        const match = episodeKey.match(/S(\d+)/);
        if (match) {
          const season = parseInt(match[1], 10);
          seasons.add(season);
        }
      });

      return {
        seasons: seasons.size,
        episodes: uniqueEpisodes.length,
      };
    };

    setArchiveInfo(getSeasonAndEpisodeCounts);
    return () => {};
  }, [fileContent]);

  const totalPages = Math.ceil(
    fileContent ? (fileContent.split("#EXTINF:").length - 1) / itemsPerPage : 0
  );

  const handlePageChange = (selectedPage: number) => {
    setCurrentPage(selectedPage);
  };

  const renderPageNumbers = () => {
    const pageNumbers = Array.from({ length: totalPages });

    if (totalPages <= 5) {
      return pageNumbers.map((_, index) => (
        <li key={index}>
          <button
            onClick={() => handlePageChange(index + 1)}
            className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white 
            ${currentPage === index + 1 ? "active" : ""}
            `}
          >
            <span
              className={` ${currentPage === index + 1 ? "font-bold" : ""}`}
            >
              {index + 1}
            </span>
          </button>
        </li>
      ));
    }

    const visiblePages = getVisiblePages(currentPage, totalPages);

    return visiblePages.map((page, index) => (
      <li key={index}>
        {page === "..." ? (
          <span className="px-3 h-8 leading-tight text-gray-500">{page}</span>
        ) : (
          <button
            onClick={() => handlePageChange(+page)}
            className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white 
            ${currentPage === page ? "active" : ""}
            `}
          >
            <span className={` ${currentPage === page ? "font-bold" : ""}`}>
              {page}
            </span>
          </button>
        )}
      </li>
    ));
  };

  const getVisiblePages = (
    currentPage: number,
    totalPages: number
  ): (number | string)[] => {
    const visiblePages: (number | string)[] = [];
    const totalVisiblePages = 5;

    if (totalPages <= totalVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage <= Math.ceil(totalVisiblePages / 2)) {
        for (let i = 1; i <= totalVisiblePages - 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push("...");
        visiblePages.push(totalPages);
      } else if (
        currentPage >=
        totalPages - Math.floor(totalVisiblePages / 2)
      ) {
        visiblePages.push(1);
        visiblePages.push("...");
        for (let i = totalPages - totalVisiblePages + 2; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        visiblePages.push(1);
        visiblePages.push("...");
        for (
          let i = currentPage - Math.floor(totalVisiblePages / 2) + 1;
          i <= currentPage + Math.ceil(totalVisiblePages / 2) - 2;
          i++
        ) {
          visiblePages.push(i);
        }
        visiblePages.push("...");
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  };

  const resetFile = () => {
    setFileContent(null);
    setHasError(false);
    setCurrentPage(1);
    setContentName("");
    setErrorsIndexState([]);
    setActualErrorIndex(-1);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    openModal();
  };

  const goToError = () => {
    let auxErrorIndex = actualErrorIndex;

    auxErrorIndex =
      auxErrorIndex + 1 > errorsIndexState.length - 1 ? 0 : auxErrorIndex + 1;

    const totalPages = Math.ceil(
      fileContent
        ? (fileContent.split("#EXTINF:").length - 1) / itemsPerPage
        : 0
    );
    const adjustedIndex = errorsIndexState[auxErrorIndex];
    const page = Math.floor(adjustedIndex / itemsPerPage) + 1;
    const positionOnPage = (adjustedIndex % itemsPerPage) + 1;

    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);

      const elementId = `linha-${positionOnPage - 1}`;
      console.debug("Scrolling to ", elementId);

      setTimeout(() => {
        const errorElement = document.getElementById(elementId);

        if (errorElement) {
          errorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        }
      }, 150);

      setActualErrorIndex(auxErrorIndex);
      return;
    } else {
      console.debug("Erro: Página inválida");
    }
  };

  const handleSaveLine = (index: number) => {
    const adjustedIndex = index + (currentPage - 1) * itemsPerPage;

    if (fileContent) {
      const lines = fileContent.split("#EXTINF:");
      lines[adjustedIndex + 1] = selectedLine || "";

      const updatedFileContent = lines.join("#EXTINF:");
      setFileContent(updatedFileContent);

      const newUpdatedFileContent = updatedFileContent.replace(
        `#EXTINF:${selectedLine}`,
        `#EXTINF:${selectedLine}`
      );

      const updatedFile = new Blob([newUpdatedFileContent], {
        type: "text/plain",
      });

      setUploadedFile(new File([updatedFile], "modified_playlist.m3u"));

      setSelectedLine(null);
    }
  };

  const saveToFile = (updatedContent: string) => {
    const blob = new Blob([updatedContent], { type: "application/x-mpegURL" });
    const fileName = "updated_m3u.m3u";

    // Cria um objeto URL temporário e cria um link para fazer o download do arquivo
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    // Simula um clique no link para iniciar o download
    link.click();

    // Libera o objeto URL temporário
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="relative  flex flex-col justify-center items-center py-3 gap-3 min-h-screen">
        <div className="flex flex-wrap gap-4 w-2/3 justify-center items-center">
          <div>
            <h1 className="font-bold text-5xl">Warez Add Content</h1>
            <span className="text-xs">Powered by Ezeq</span>
          </div>
          {!fileContent && (
            <div className="w-full flex flex-col justify-center items-center gap-3">
              <div className="max-w-2xl mx-auto">
                <div
                  className="flex items-center justify-center w-full"
                  {...getRootProps()}
                >
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-5">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">
                          Clique para fazer upload
                        </span>{" "}
                        ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        APENAS M3U FILES
                      </p>
                    </div>
                    <input {...getInputProps()} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {fileContent && (
            <div className="w-full sticky top-0 bg-white border border-solid py-3 flex justify-between px-3 items-center flex-wrap">
              <div className="flex flex-col">
                <h1 className=" text-2xl font-bold ">{contentName}</h1>
                <span>Qtd. Temporadas: {archiveInfo?.seasons}</span>
                <span>Qtd. Episódios: {archiveInfo?.episodes}</span>
                <a
                  className="mt-2 hover:text-green-500 cursor-pointer"
                  onClick={() => saveToFile(fileContent)}
                >
                  Baixar arquivo
                </a>
              </div>
              <div className="flex flex-col justify-center items-center">
                <button
                  type="button"
                  className=" w-fit rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 bg-red-300"
                  onClick={() => resetFile()}
                >
                  <span className="sr-only">Close menu</span>
                  <svg
                    className="h-6 w-6 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`mt-4 bg-blue-500 ${
                    hasError ? "bg-red-400" : ""
                  } text-white px-4 py-2 rounded`}
                  onClick={
                    hasError
                      ? () => goToError()
                      : () => handleFileUpload(uploadedFile as File)
                  }
                  //disabled={hasError}
                >
                  <span>{!hasError && "Postar Arquivo"}</span>
                  <span>
                    {hasError &&
                      actualErrorIndex === -1 &&
                      `Arquivo com erros! (${errorsIndexState.length})`}
                  </span>
                  <span>
                    {hasError &&
                      actualErrorIndex !== -1 &&
                      `Próximo Erro (${actualErrorIndex + 1}/${
                        errorsIndexState.length
                      })`}
                  </span>
                </button>
              </div>
            </div>
          )}
          {slicedItems.map((episode, index) => {
            const lines = episode
              .split("\n")
              .filter((line) => line.trim() !== "");
            const episodeInfo = lines[0].trim();
            const videoUrl = lines[1].trim();
            const fullLine = `#EXTINF:${episode}`;
            const isValid = isValidEntry(fullLine, contentName || "");
            console.log(isValid);
            const formattedEpisodeInfo = () => {
              const match = episodeInfo.match(/S(\d+)\s*E(\d+)/);

              if (match) {
                const season = match[1];
                const episodeNumber = match[2];

                return `S${season} E${episodeNumber}`;
              }

              return episodeInfo;
            };

            return (
              <section
                id={`linha-${index}`}
                key={index}
                className={`border rounded p-4 w-full shadow-md ${
                  isValid ? "bg-green-500" : "bg-red-500"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-lg font-bold">
                      {formattedEpisodeInfo()}
                    </h2>
                  </div>
                  <div>
                    <button
                      onClick={() => toggleVideo(index)}
                      className={`bg-blue-500 text-white px-4 py-2 rounded ${
                        videosEnabled[index] ? "bg-opacity-50" : ""
                      }`}
                    >
                      {videosEnabled[index] ? "Vídeo Ligado" : "Abrir Vídeo"}
                    </button>
                  </div>
                </div>
                {videosEnabled[index] && (
                  <div>
                    <video controls className="w-full">
                      <source src={videoUrl} type="video/mp4" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  </div>
                )}
                <div className="mt-2 flex flex-col gap-3">
                  <button
                    onClick={() => toggleShowFullLine(index)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-bold"
                  >
                    Mostrar Linha Completa
                  </button>
                  {showFullLines[index] && selectedLine && (
                    <div className="px-2 bg-white py-4 rounded-lg">
                      <textarea
                        value={selectedLine}
                        onChange={(e) => setSelectedLine(e.target.value)}
                        className="w-full h-20 p-2 border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={() => handleSaveLine(index)}
                        className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  )}

                  {isValid && typeof isValid === "object" && (
                    <div className="flex flex-col text-red-800">
                      <span className="font-bold">
                        Essa linha apresenta erros:{" "}
                      </span>
                      <ol className="flex flex-col">
                        {isValid.hasUnclosedQuote && (
                          <li>
                            O nome do conteúdo possuí aspas (simples ou duplas)
                            solo.
                          </li>
                        )}
                        {isValid.hasInValidFormat && (
                          <li>
                            A parte que representa temporada e episódio está
                            incorreta.
                          </li>
                        )}
                        {!isValid.isInTvgName && (
                          <li>
                            Em tv-name não foi encontrado o nome do conteúdo.
                          </li>
                        )}
                        {!isValid.isInEndOfLine && (
                          <li>
                            Antes da url não foi encontrado o nome do conteúdo.
                          </li>
                        )}
                      </ol>
                    </div>
                  )}
                  <div className="w-full justify-end items-end text-end">
                    <span className="text-white font-semibold">
                      Linha {1 + index + (currentPage - 1) * itemsPerPage}
                    </span>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        {fileContent && (
          <div className="flex py-2 h-fit w-3/4  border border-solid border-black rounded-lg justify-center items-center sticky bg-white bottom-0 z-50 px-4 ">
            <select
              className="p-2 mr-2 border border-solid border-green-300 rounded-sm cursor-pointer"
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              value={itemsPerPage}
            >
              {[10, 20, 50].map((perPage) => (
                <option key={perPage} value={perPage}>
                  {perPage} itens por página
                </option>
              ))}
            </select>

            <nav className="w-full flex justify-center items-center">
              <ul className="inline-flex -space-x-px text-sm">
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    Previous
                  </button>
                </li>
                {renderPageNumbers()}
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white rounded-e-lg"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      {isModalOpen && (
        <ModalUpload
          onClose={closeModal}
          onUploadSuccess={closeModal}
          contentName={contentName || ""}
          file={uploadedFile}
        />
      )}
    </>
  );
};

export default M3UReader;
