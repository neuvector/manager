#!/bin/bash

#Display current JDK Version
java -version

showResponse=$1
token=""
outputDir="output"
inputDir="input"
base_url="https://127.0.0.1:8443"
file="${inputDir}/test_data.properties"

function start_test {
  #Variables initialzation

  #Remove all output files
  rm -f ${outputDir}
  mkdir ${outputDir}
  rm -f ${outputDir}/*_response

  #Authentication
  #POST-/auth
  auth_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/auth_response \
    --location --request POST "${base_url}/auth" \
    --header 'Content-Type: application/json' \
    --data-raw '{"username":"u-admin","password":"1qazXSW@"}'
  )
  if [ $auth_status == "200" ]
  then
    echo "Http status (POST-/auth): "$auth_status
    token=$(cat ${outputDir}/auth_response | jq '.token.token')
    roles=$(cat ${outputDir}/auth_response | jq '.roles')
    login_timestamp=$(cat ${outputDir}/auth_response | jq '.login_timestamp')
    token=${token:1:${#token} - 2}
    if [ $showResponse ]; then
      echo "Response: "
      cat ${outputDir}/auth_response | jq '.'
      echo "Token: "$token
    fi
  else
    echo "Error is found (POST-/auth): " $auth_status
  fi

  #POST-/role
  role_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/role_response \
    --location --request POST "${base_url}/role" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    --data-raw "[$roles, $login_timestamp]"
  )
  if [ $auth_status == "200" ]
  then
    echo "Http status (POST-/auth): "$role_status
    if [ $showResponse ]; then
      echo "Response: "
      cat ${outputDir}/role_response | jq '.'
    fi
  else
    echo "Error is found (POST-/auth): " $role_status
  fi

  #GET-/dashboard/scores?isGlobalUser=true
  score1_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/score1_response \
    --location --request GET "${base_url}/dashboard/scores?isGlobalUser=true" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}"
  )
  if [ $score1_status == "200" ]; then
    echo "Http status (GET-/dashboard/scores?isGlobalUser=true): "$score1_status
    if [ $showResponse ]; then
      echo "Response: "
      cat ${outputDir}/score1_response | jq '.'
    fi
  else
    echo "Error is found (GET-/dashboard/scores?isGlobalUser=true): " $score1_status
  fi

  #GET-/dashboard/scores?isGlobalUser=false
  score2_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/score2_response \
    --location --request GET "${base_url}/dashboard/scores?isGlobalUser=false" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}"
  )
  if [ $score2_status == "200" ]
  then
    echo "Http status (GET-/dashboard/scores?isGlobalUser=false): "$score2_status
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/score2_response | jq '.'
    fi
  else
    echo "Error is found (GET-/dashboard/scores?isGlobalUser=false): " $score2_status
  fi

  #GET-/dashboard/scores?isGlobalUser=true&f_domain=default
  score3_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/score3_response \
    --location --request GET "${base_url}/dashboard/scores?isGlobalUser=true&f_domain=default" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}"
  )
  if [ $score3_status == "200" ]
  then
    echo "Http status (GET-/dashboard/scores?isGlobalUser=true&f_domain=default): "$score3_status
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/score3_response | jq '.'
    fi
  else
    echo "Error is found (GET-/dashboard/scores?isGlobalUser=true&f_domain=default): " $score3_status
  fi

  #GET-/scan/config
  scan_config_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/scan_config_response.gz \
    --location --request GET "${base_url}/scan/config" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $scan_config_status == "200" ]
  then
    echo "Http status (GET-/scan/config): "$scan_config_status
    rm -f ${outputDir}/scan_config_response
    gzip -d ${outputDir}/scan_config_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/scan_config_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/config): " $scan_config_status
  fi

  #GET-/scan/status
  scan_status_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/scan_status_response.gz \
    --location --request GET "${base_url}/scan/status" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $scan_status_status == "200" ]
  then
    echo "Http status (GET-/scan/status): "$scan_status_status
    rm -f ${outputDir}/scan_status_response
    gzip -d ${outputDir}/scan_status_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/scan_status_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/status): " $scan_status_status
  fi

  #GET-/scan/workload?id=${workload_id}&view=pod&start=0&limit=0
  single_scanned_workload_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/single_scanned_workload_response.gz \
    --location --request GET "${base_url}/scan/workload?id=${workload_id}&view=pod&start=0&limit=0" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $single_scanned_workload_status == "200" ]
  then
    echo "Http status (GET-/scan/workload?id=${workload_id}&view=pod&start=0&limit=0): "$single_scanned_workload_status
      rm -f ${outputDir}/single_scanned_workload_response
      gzip -d ${outputDir}/single_scanned_workload_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/single_scanned_workload_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/workload?id=${workload_id}&view=pod&start=0&limit=0): " $single_scanned_workload_status
  fi

  #GET-/scan/top?s_severity=desc&start=0&limit=5
  scan_top_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/scan_top_response.gz \
    --location --request GET "${base_url}/scan/top?s_severity=desc&start=0&limit=5" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $scan_top_status == "200" ]
  then
    echo "Http status (GET-/scan/top?s_severity=desc&start=0&limit=5): "$scan_top_status
      rm -f ${outputDir}/scan_top_response
      gzip -d ${outputDir}/scan_top_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/scan_top_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/top?s_severity=desc&start=0&limit=5): " $scan_top_status
  fi

  #GET-/scan/host?id=${host_id}
  single_scanned_host_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/single_scanned_host_response.gz \
    --location --request GET "${base_url}/scan/host?id=${host_id}" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $single_scanned_host_status == "200" ]
  then
    echo "Http status (GET-/scan/host?id=${host_id}): "$single_scanned_host_status
      rm -f ${outputDir}/single_scanned_host_response
      gzip -d ${outputDir}/single_scanned_host_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/single_scanned_host_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/host?id=${host_id}): " $single_scanned_host_status
  fi

  #GET-/scan/platform
  platform_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/platform_response.gz \
    --location --request GET "${base_url}/scan/platform" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $platform_status == "200" ]
  then
    echo "Http status (GET-/scan/platform): "$platform_status
      rm -f ${outputDir}/platform_response
      gzip -d ${outputDir}/platform_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/platform_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/platform): " $platform_status
  fi

  #GET-/scan/platform?platform=${platform}
  single_platform_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/single_platform_response.gz \
    --location --request GET "${base_url}/scan/platform?platform=${platform}" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $single_platform_status == "200" ]
  then
    echo "Http status (GET-/scan/platform?platform=${platform}): "$single_platform_status
      rm -f ${outputDir}/single_platform_response
      gzip -d ${outputDir}/single_platform_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/single_platform_response | jq '.'
    fi
  else
    echo "Error is found (GET-/scan/platform?platform=${platform}): " $single_platform_status
  fi

  #GET-/user
  user_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/user_response.gz \
    --location --request GET "${base_url}/user" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $user_status == "200" ]
  then
    echo "Http status (GET-/user): "$user_status
      rm -f ${outputDir}/user_response
      gzip -d ${outputDir}/user_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/user_response | jq '.'
    fi
  else
    echo "Error is found (GET-/user): " $user_status
  fi

  #GET-/user?name=${user_name}
  single_user_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/single_user_response.gz \
    --location --request GET "${base_url}/user?name=${user_name}" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $single_user_status == "200" ]
  then
    echo "Http status (GET-/user?name=${user_name}): " $single_user_status
      rm -f ${outputDir}/single_user_response
      gzip -d ${outputDir}/single_user_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/single_user_response | jq '.'
    fi
  else
    echo "Error is found (GET-/user?name=${user_name}): " $single_user_status
  fi

  #GET-/policy
  policy_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/policy_response.gz \
    --location --request GET "${base_url}/policy" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $policy_status == "200" ]
  then
    echo "Http status (GET-/policy): " $policy_status
      rm -f ${outputDir}/policy_response
      cp ${outputDir}/policy_response.gz ${inputDir}/policy_payload.gz
      gzip -d ${outputDir}/policy_response.gz
      policy=$(cat ${outputDir}/policy_response | jq '.')
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/policy_response | jq '.'
    fi
  else
    echo "Error is found (GET-/policy): " $policy_status
  fi

  #PATCH-/policy
  update_policy_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/update_policy_response \
    --location --request PATCH "${base_url}/policy?scope=local" \
    --header 'Content-Type: application/json' \
    --header 'Content-Encoding: gzip' \
    --header "token: ${token}" \
    --data-binary @${inputDir}/policy_payload.gz
  )
  if [ $update_policy_status == "200" ]
  then
    echo "Http status (PATCH-/policy): " $update_policy_status
  else
    echo "Error is found (PATCH-/policy): " $update_policy_status
  fi

  #GET-/group
  group_status=$(
    curl --insecure --write-out '%{http_code}' \
    -s -o ${outputDir}/group_response.gz \
    --location --request GET "${base_url}/group" \
    --header 'Content-Type: application/json' \
    --header "token: ${token}" \
    -sH 'Accept-encoding: gzip'
  )
  if [ $group_status == "200" ]
  then
    echo "Http status (GET-/group): "$group_status
      rm -f ${outputDir}/group_response
      gzip -d ${outputDir}/group_response.gz
    if [ $showResponse ]
    then
      echo "Response: "
      cat ${outputDir}/group_response | jq '.'
    fi
  else
    echo "Error is found (GET-/group): " $group_status
  fi
}

if [ -f "$file" ]
then
  while IFS='=' read -r key value
  do
    key=$(echo $key | tr '.' '_')
    eval ${key}=\${value}
  done < "$file"
  echo "Workload ID = " ${workload_id}
  echo "Host ID = " ${host_id}
  echo "Platform = " ${platform}

  echo "Start to test"
  start_test
else
  echo "$file is not found."
fi
